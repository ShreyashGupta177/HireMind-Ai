require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require("multer");
const fs = require("fs");
const fsExtra = require("fs-extra");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5001;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const ML_TIMEOUT = parseInt(process.env.ML_TIMEOUT) || 60000;

const uploadsDir = path.join(__dirname, "uploads");
fsExtra.ensureDirSync(uploadsDir);

// CORS Configuration
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: "10mb" }));

// File upload config
const upload = multer({
    dest: uploadsDir,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only PDF or DOCX files allowed (max 2MB)"));
        }
    }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper Functions
function cleanText(text) {
    if (!text || text.trim().length === 0) {
        throw new Error("Empty or unreadable file content");
    }
    return text.replace(/\n/g, " ").replace(/[^\x00-\x7F]/g, "").replace(/\s+/g, " ").trim().substring(0, 10000);
}

async function extractText(filePath, mimeType) {
    let text = "";
    try {
        if (mimeType === "application/pdf") {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            text = data.text;
        } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            const result = await mammoth.extractRawText({ path: filePath });
            text = result.value;
        } else {
            throw new Error("Unsupported file type");
        }
        return cleanText(text);
    } catch (error) {
        throw new Error(`Text extraction failed: ${error.message}`);
    }
}

async function deleteTempFile(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) {
            await fsExtra.remove(filePath);
        }
    } catch (error) {
        console.error("Failed to delete temp file:", error);
    }
}

async function callAIModel(prompt, retries = 2) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    for (let i = 0; i < retries; i++) {
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            try {
                return JSON.parse(text);
            } catch {
                return { raw: text };
            }
        } catch (error) {
            console.error(`AI call attempt ${i + 1} failed:`, error.message);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

const successResponse = (data) => ({
    success: true,
    data,
    error: null,
    timestamp: new Date().toISOString()
});

const errorResponse = (message, statusCode = 400) => ({
    success: false,
    data: null,
    error: message,
    statusCode,
    timestamp: new Date().toISOString()
});

// Health Check
app.get("/", (req, res) => {
    res.json(successResponse({
        message: "Job Portal Backend Running Successfully",
        status: "active",
        timestamp: new Date().toISOString()
    }));
});

app.get("/api/ml/health", async (req, res) => {
    try {
        const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
        res.json(successResponse({ ml_service: "connected", status: response.data }));
    } catch (error) {
        res.status(503).json(errorResponse("ML service not available on port 8000", 503));
    }
});

// Jobs Data
const jobs = [
    { id: 1, title: "Frontend Developer", skills: ["React", "JavaScript", "HTML", "CSS", "Tailwind"] },
    { id: 2, title: "Backend Developer", skills: ["Node.js", "Express", "MongoDB", "API", "Python"] },
    { id: 3, title: "Full Stack Developer", skills: ["React", "Node.js", "MongoDB", "Express", "JavaScript"] },
    { id: 4, title: "UI/UX Designer", skills: ["Figma", "Adobe XD", "Sketch", "Prototyping", "User Research"] },
    { id: 5, title: "DevOps Engineer", skills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"] },
    { id: 6, title: "Data Scientist", skills: ["Python", "Machine Learning", "SQL", "TensorFlow", "Statistics"] },
    { id: 7, title: "Mobile Developer", skills: ["React Native", "Flutter", "iOS", "Android", "Firebase"] },
    { id: 8, title: "QA Engineer", skills: ["Selenium", "Jest", "Cypress", "Manual Testing", "Automation"] }
];

app.get("/api/jobs", (req, res) => {
    res.json(successResponse(jobs));
});

app.get("/api/jobs/:id", (req, res) => {
    const job = jobs.find(j => j.id === parseInt(req.params.id));
    if (!job) return res.status(404).json(errorResponse("Job not found"));
    res.json(successResponse(job));
});

// Skills Match
app.post("/api/match", (req, res) => {
    try {
        const { resumeSkills, jobSkills } = req.body;
        if (!resumeSkills || !Array.isArray(resumeSkills) || !jobSkills || !Array.isArray(jobSkills)) {
            return res.status(400).json(errorResponse("Both resumeSkills and jobSkills arrays are required"));
        }
        const normalizedResumeSkills = resumeSkills.map(s => s.toLowerCase().trim());
        const normalizedJobSkills = jobSkills.map(s => s.toLowerCase().trim());
        const matchedSkills = normalizedResumeSkills.filter(skill => normalizedJobSkills.includes(skill));
        const score = (matchedSkills.length / normalizedJobSkills.length) * 100;
        const roundedScore = Math.round(score);
        let message = roundedScore >= 80 ? "Excellent Match!" : roundedScore >= 60 ? "Good Match" : roundedScore >= 40 ? "Partial Match" : "Low Match";
        res.json(successResponse({ matchScore: roundedScore, matchedSkills, missingSkills: normalizedJobSkills.filter(s => !normalizedResumeSkills.includes(s)), message }));
    } catch (err) {
        res.status(500).json(errorResponse("Match calculation failed"));
    }
});

// AI Analysis (Gemini)
app.post("/api/analyze", async (req, res) => {
    try {
        const { resume, job } = req.body;
        if (!resume || resume.length < 10) {
            return res.status(400).json(errorResponse("Valid resume text required"));
        }
        if (!job || job.length < 10) {
            return res.status(400).json(errorResponse("Valid job description required"));
        }
        const prompt = `Analyze this resume against the job description. Resume: ${resume.substring(0, 3000)} Job: ${job.substring(0, 3000)} Return JSON: { "overall_score": 75, "missing_skills": [], "strengths": [], "verdict": "", "cover_letter": "" }`;
        const result = await callAIModel(prompt);
        res.json(successResponse(result));
    } catch (err) {
        res.status(500).json(errorResponse("AI analysis failed: " + err.message));
    }
});

// ML Integration
app.post("/api/ml/analyze", async (req, res) => {
    try {
        const { resume_text, jd_text } = req.body;
        if (!resume_text || resume_text.length < 50) {
            return res.status(400).json(errorResponse("Valid resume_text required (minimum 50 characters)"));
        }
        if (!jd_text || jd_text.length < 50) {
            return res.status(400).json(errorResponse("Valid jd_text required (minimum 50 characters)"));
        }
        const mlResponse = await axios.post(`${ML_SERVICE_URL}/analyze`, { resume_text, jd_text }, { timeout: ML_TIMEOUT });
        res.json(successResponse(mlResponse.data));
    } catch (error) {
        if (error.code === "ECONNREFUSED") {
            return res.status(503).json(errorResponse("ML service is not running on port 8000", 503));
        }
        res.status(500).json(errorResponse("ML analysis failed: " + error.message));
    }
});

// Application Tracker
let applications = [];
const APPS_FILE = path.join(__dirname, "applications.json");

try {
    if (fs.existsSync(APPS_FILE)) {
        const data = fs.readFileSync(APPS_FILE, "utf8");
        applications = JSON.parse(data);
        console.log(`Loaded ${applications.length} saved applications`);
    }
} catch (error) {
    console.error("Failed to load applications:", error);
}

function saveApplications() {
    try {
        fs.writeFileSync(APPS_FILE, JSON.stringify(applications, null, 2));
    } catch (error) {
        console.error("Failed to save applications:", error);
    }
}

app.post("/api/apply", (req, res) => {
    try {
        const { company, role, notes } = req.body;
        if (!company || !role) {
            return res.status(400).json(errorResponse("Company and role required"));
        }
        const newApp = { id: Date.now(), company, role, status: "Applied", date: new Date().toISOString(), notes: notes || "", updatedAt: new Date().toISOString() };
        applications.unshift(newApp);
        saveApplications();
        res.json(successResponse(newApp));
    } catch (err) {
        res.status(500).json(errorResponse("Failed to submit application"));
    }
});

app.get("/api/applications", (req, res) => {
    res.json(successResponse({ total: applications.length, applications }));
});

app.put("/api/applications/:id", (req, res) => {
    try {
        const { status } = req.body;
        const appIndex = applications.findIndex(a => a.id === parseInt(req.params.id));
        if (appIndex === -1) return res.status(404).json(errorResponse("Application not found"));
        applications[appIndex].status = status;
        applications[appIndex].updatedAt = new Date().toISOString();
        saveApplications();
        res.json(successResponse(applications[appIndex]));
    } catch (err) {
        res.status(500).json(errorResponse("Failed to update application"));
    }
});

app.delete("/api/applications/:id", (req, res) => {
    const appIndex = applications.findIndex(a => a.id === parseInt(req.params.id));
    if (appIndex === -1) return res.status(404).json(errorResponse("Application not found"));
    const deleted = applications.splice(appIndex, 1)[0];
    saveApplications();
    res.json(successResponse({ message: "Application deleted", deleted }));
});

// File Upload
app.post("/api/upload", upload.single("file"), async (req, res) => {
    const filePath = req.file?.path;
    try {
        if (!req.file) return res.status(400).json(errorResponse("No file uploaded"));
        const extractedText = await extractText(filePath, req.file.mimetype);
        res.json(successResponse({ extractedText, preview: extractedText.substring(0, 500) }));
    } catch (err) {
        res.status(500).json(errorResponse(err.message));
    } finally {
        if (filePath) await deleteTempFile(filePath);
    }
});

// ==================== SCRAPING ENDPOINTS ====================

// Store scraped jobs in memory
let scrapedJobs = [];
const SCRAPED_FILE = path.join(__dirname, "scraped_jobs.json");

// Load saved scraped jobs on startup
try {
    if (fs.existsSync(SCRAPED_FILE)) {
        const data = fs.readFileSync(SCRAPED_FILE, "utf8");
        scrapedJobs = JSON.parse(data);
        console.log(`📋 Loaded ${scrapedJobs.length} scraped jobs`);
    }
} catch (error) {
    console.error("Failed to load scraped jobs:", error);
}

// Save scraped jobs to file
function saveScrapedJobs() {
    try {
        fs.writeFileSync(SCRAPED_FILE, JSON.stringify(scrapedJobs, null, 2));
    } catch (error) {
        console.error("Failed to save scraped jobs:", error);
    }
}

// Receive scraped jobs from Python scraper
app.post("/api/scrape/results", (req, res) => {
    try {
        const { platform, jobs, scraped_at } = req.body;
        
        if (!platform || !jobs || !Array.isArray(jobs)) {
            return res.status(400).json(errorResponse("Platform and jobs array required"));
        }
        
        console.log(`\n📥 Received ${jobs.length} jobs from ${platform}`);
        
        const jobsWithMeta = jobs.map(job => ({
            ...job,
            platform: platform,
            scraped_at: scraped_at || new Date().toISOString(),
            received_at: new Date().toISOString()
        }));
        
        scrapedJobs.push(...jobsWithMeta);
        saveScrapedJobs();
        
        console.log(`💾 Total scraped jobs: ${scrapedJobs.length}`);
        
        res.json(successResponse({
            message: `Successfully stored ${jobs.length} jobs from ${platform}`,
            total_jobs: scrapedJobs.length
        }));
        
    } catch (error) {
        console.error("Error storing scraped jobs:", error);
        res.status(500).json(errorResponse("Failed to store scraped jobs"));
    }
});

// Get all scraped jobs
app.get("/api/scrape/jobs", (req, res) => {
    try {
        const { platform, limit = 100 } = req.query;
        
        let filteredJobs = scrapedJobs;
        
        if (platform) {
            filteredJobs = scrapedJobs.filter(job => job.platform === platform);
        }
        
        const uniqueJobs = [];
        const seen = new Set();
        for (const job of filteredJobs) {
            const key = `${job.title}-${job.company}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueJobs.push(job);
            }
        }
        
        res.json(successResponse({
            total: uniqueJobs.length,
            jobs: uniqueJobs.slice(0, parseInt(limit)),
            platforms: [...new Set(scrapedJobs.map(j => j.platform))]
        }));
        
    } catch (error) {
        console.error("Error fetching scraped jobs:", error);
        res.status(500).json(errorResponse("Failed to fetch scraped jobs"));
    }
});

// Get statistics about scraped jobs
app.get("/api/scrape/stats", (req, res) => {
    try {
        const platformStats = {};
        for (const job of scrapedJobs) {
            platformStats[job.platform] = (platformStats[job.platform] || 0) + 1;
        }
        
        res.json(successResponse({
            total_jobs: scrapedJobs.length,
            by_platform: platformStats,
            last_scraped: scrapedJobs.length > 0 ? scrapedJobs[scrapedJobs.length - 1].received_at : null
        }));
        
    } catch (error) {
        res.status(500).json(errorResponse("Failed to get statistics"));
    }
});

// Clear all scraped jobs (for testing)
app.delete("/api/scrape/clear", (req, res) => {
    try {
        scrapedJobs = [];
        saveScrapedJobs();
        res.json(successResponse({ message: "All scraped jobs cleared" }));
    } catch (error) {
        res.status(500).json(errorResponse("Failed to clear jobs"));
    }
});

// ==================== DATA INTEGRATION ENDPOINTS ====================

// Get merged data for Frontend
app.get("/api/v2/all-data", (req, res) => {
    try {
        const allData = {
            jobs: scrapedJobs.slice(0, 100),
            applications: applications,
            statistics: {
                total_jobs: scrapedJobs.length,
                total_applications: applications.length,
                by_platform: {}
            }
        };
        
        // Calculate by platform
        for (const job of scrapedJobs) {
            const platform = job.platform || 'unknown';
            allData.statistics.by_platform[platform] = (allData.statistics.by_platform[platform] || 0) + 1;
        }
        
        res.json(successResponse(allData));
    } catch (error) {
        console.error("Error fetching all data:", error);
        res.status(500).json(errorResponse("Failed to fetch data"));
    }
});

// Get dashboard statistics
app.get("/api/v2/dashboard", (req, res) => {
    try {
        const platformStats = {};
        for (const job of scrapedJobs) {
            platformStats[job.platform] = (platformStats[job.platform] || 0) + 1;
        }
        
        res.json(successResponse({
            overview: {
                total_jobs: scrapedJobs.length,
                total_applications: applications.length,
                total_scraped: scrapedJobs.length,
                last_updated: new Date().toISOString()
            },
            by_platform: platformStats,
            by_status: {
                Applied: applications.filter(a => a.status === "Applied").length,
                Interview: applications.filter(a => a.status === "Interview").length,
                Offer: applications.filter(a => a.status === "Offer").length,
                Rejected: applications.filter(a => a.status === "Rejected").length
            }
        }));
    } catch (error) {
        console.error("Error fetching dashboard:", error);
        res.status(500).json(errorResponse("Failed to fetch dashboard data"));
    }
});

// ==================== FULL ML INTEGRATION ENDPOINTS ====================

// ML Status Check (Enhanced)
app.get("/api/ml/status", async (req, res) => {
    try {
        const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
        res.json(successResponse({
            ml_service: "connected",
            status: response.data,
            market_condition: response.data.market_condition || "NORMAL",
            version: response.data.version || "2.0.0",
            timestamp: new Date().toISOString()
        }));
    } catch (error) {
        res.json(successResponse({
            ml_service: "disconnected",
            status: "offline",
            message: "ML service not available. Using fallback matching.",
            fallback_active: true,
            timestamp: new Date().toISOString()
        }));
    }
});

// Advanced ML Analysis with Crisis Mode
app.post("/api/ml/advanced-analyze", async (req, res) => {
    try {
        const { resume_text, jd_text, market_condition } = req.body;
        
        if (!resume_text || resume_text.length < 50) {
            return res.status(400).json(errorResponse("Valid resume_text required (minimum 50 characters)"));
        }
        
        if (!jd_text || jd_text.length < 50) {
            return res.status(400).json(errorResponse("Valid jd_text required (minimum 50 characters)"));
        }
        
        // Check if ML service is available
        let mlAvailable = false;
        try {
            const healthCheck = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 3000 });
            mlAvailable = healthCheck.status === 200;
        } catch (err) {
            console.log("ML service not available, using fallback");
        }
        
        let result;
        if (mlAvailable) {
            const mlResponse = await axios.post(`${ML_SERVICE_URL}/analyze`, {
                resume_text: resume_text,
                jd_text: jd_text,
                market_condition: market_condition || null
            }, { timeout: 60000 });
            result = mlResponse.data;
        } else {
            // Fallback analysis when ML is offline
            result = {
                match_score: Math.floor(Math.random() * 100),
                missing_skills: ["Python", "Machine Learning", "Cloud Computing", "API Development"],
                keyword_alignment: ["Add more technical keywords to your resume"],
                reasoning: "ML service offline - using basic analysis. Please start the ML service for detailed insights.",
                tailored_summary: "Consider adding more relevant keywords and skills to your resume.",
                recommendation: "Start ML service for accurate analysis",
                learning_roadmap: [
                    { skill: "Python", platform: "Coursera", learning_link: "https://www.coursera.org/learn/python", estimated_time: "4 weeks" },
                    { skill: "Machine Learning", platform: "Coursera", learning_link: "https://www.coursera.org/learn/machine-learning", estimated_time: "8 weeks" }
                ],
                crisis_mode_advice: "Market conditions: Normal. Focus on upskilling in high-demand areas."
            };
        }
        
        res.json(successResponse({
            ...result,
            ml_service_used: mlAvailable,
            analysis_timestamp: new Date().toISOString()
        }));
        
    } catch (error) {
        console.error("ML Analysis error:", error);
        res.status(500).json(errorResponse("ML analysis failed: " + error.message));
    }
});

// Rank scraped jobs using ML (Crisis-Aware)
app.post("/api/ml/rank-scraped-jobs", async (req, res) => {
    try {
        const { resume_text, platform_filter, limit = 50 } = req.body;
        
        if (!resume_text || resume_text.length < 50) {
            return res.status(400).json(errorResponse("Valid resume_text required (minimum 50 characters)"));
        }
        
        // Get scraped jobs from storage
        let jobsToRank = [...scrapedJobs];
        
        if (platform_filter && platform_filter !== 'all') {
            jobsToRank = jobsToRank.filter(job => job.platform === platform_filter);
        }
        
        jobsToRank = jobsToRank.slice(0, limit);
        
        if (jobsToRank.length === 0) {
            return res.status(404).json(errorResponse("No scraped jobs found. Run the scraper first."));
        }
        
        // Check ML service availability
        let mlAvailable = false;
        let mlResponse = null;
        
        try {
            const healthCheck = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 3000 });
            mlAvailable = healthCheck.status === 200;
        } catch (err) {
            console.log("ML service not available for ranking");
        }
        
        if (mlAvailable) {
            try {
                mlResponse = await axios.post(`${ML_SERVICE_URL}/rank-jobs`, {
                    resume_text: resume_text,
                    scraped_jobs: jobsToRank.map(job => ({
                        title: job.title,
                        company: job.company,
                        description: job.description || `${job.title} at ${job.company}`,
                        location: job.location,
                        skills: job.skills || [],
                        platform: job.platform
                    }))
                }, { timeout: 120000 });
            } catch (err) {
                console.error("ML ranking failed:", err.message);
                mlAvailable = false;
            }
        }
        
        let rankedJobs;
        if (mlAvailable && mlResponse) {
            rankedJobs = mlResponse.data.ranked_jobs;
        } else {
            // Fallback ranking with basic keyword matching
            rankedJobs = jobsToRank.map(job => {
                let score = 0;
                const resumeLower = resume_text.toLowerCase();
                const titleLower = job.title.toLowerCase();
                const skillsText = (job.skills || []).join(' ').toLowerCase();
                
                // Title matching
                if (resumeLower.includes(titleLower) || titleLower.includes(resumeLower.split(' ')[0])) {
                    score += 30;
                }
                
                // Skills matching
                if (job.skills) {
                    for (const skill of job.skills) {
                        if (resumeLower.includes(skill.toLowerCase())) {
                            score += 20;
                        }
                    }
                }
                
                // Company reputation boost
                const topCompanies = ['google', 'microsoft', 'amazon', 'apple', 'meta', 'infosys', 'tcs', 'wipro'];
                if (topCompanies.some(company => job.company?.toLowerCase().includes(company))) {
                    score += 10;
                }
                
                return {
                    job_title: job.title,
                    company: job.company,
                    location: job.location,
                    source: job.platform,
                    match_score: Math.min(score, 100),
                    reasoning: "Fallback ranking - ML service offline. Using keyword matching.",
                    missing_skills: ["Connect ML service for detailed analysis"]
                };
            }).sort((a, b) => b.match_score - a.match_score);
        }
        
        res.json(successResponse({
            ranked_jobs: rankedJobs,
            total_analyzed: jobsToRank.length,
            ml_service_used: mlAvailable,
            market_condition: mlResponse?.data?.market_condition || "Unknown",
            timestamp: new Date().toISOString()
        }));
        
    } catch (error) {
        console.error("Job ranking error:", error);
        res.status(500).json(errorResponse("Failed to rank jobs: " + error.message));
    }
});

// Get crisis mode advice
app.get("/api/ml/crisis-advice", async (req, res) => {
    try {
        let mlAvailable = false;
        let marketCondition = "NORMAL";
        
        try {
            const healthCheck = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 3000 });
            mlAvailable = healthCheck.status === 200;
            marketCondition = healthCheck.data?.market_condition || "NORMAL";
        } catch (err) {
            console.log("ML service not available");
        }
        
        res.json(successResponse({
            ml_service_available: mlAvailable,
            market_condition: marketCondition,
            crisis_mode_active: marketCondition === "CRISIS",
            advice: marketCondition === "CRISIS" 
                ? "⚠️ CRISIS MODE ACTIVE: Focus on recession-proof skills: Cloud Computing, Cybersecurity, AI Automation, DevOps. Prioritize remote work opportunities and emergency certifications."
                : "✅ NORMAL MARKET: Focus on skill development, networking, and long-term career growth. Consider upskilling in AI/ML and Cloud technologies.",
            recommended_skills: marketCondition === "CRISIS" 
                ? ["Cloud Computing (AWS/Azure)", "Cybersecurity", "DevOps", "Python", "Data Analysis", "Remote Collaboration"]
                : ["Full Stack Development", "Mobile Development", "AI/ML", "Cloud Architecture", "System Design"],
            emergency_resources: marketCondition === "CRISIS" ? {
                quick_certifications: ["AWS Cloud Practitioner", "Google IT Support", "Meta Frontend Developer"],
                job_portals: ["LinkedIn Jobs", "Indeed", "Naukri", "Internshala"],
                upskilling_platforms: ["Coursera", "Udemy", "freeCodeCamp", "YouTube"]
            } : null,
            timestamp: new Date().toISOString()
        }));
        
    } catch (error) {
        console.error("Crisis advice error:", error);
        res.json(successResponse({
            ml_service_available: false,
            market_condition: "Unknown",
            crisis_mode_active: false,
            advice: "ML service not available. Please start the ML service for crisis-aware career advice.",
            timestamp: new Date().toISOString()
        }));
    }
});

// Refresh all data (force reload from files)
app.post("/api/v2/refresh-data", (req, res) => {
    try {
        // Reload scraped jobs
        if (fs.existsSync(SCRAPED_FILE)) {
            const data = fs.readFileSync(SCRAPED_FILE, "utf8");
            scrapedJobs = JSON.parse(data);
            console.log(`🔄 Refreshed ${scrapedJobs.length} scraped jobs`);
        }
        
        // Reload applications
        if (fs.existsSync(APPS_FILE)) {
            const data = fs.readFileSync(APPS_FILE, "utf8");
            applications = JSON.parse(data);
            console.log(`🔄 Refreshed ${applications.length} applications`);
        }
        
        res.json(successResponse({
            message: "Data refreshed successfully",
            total_jobs: scrapedJobs.length,
            total_applications: applications.length,
            timestamp: new Date().toISOString()
        }));
    } catch (error) {
        console.error("Data refresh error:", error);
        res.status(500).json(errorResponse("Failed to refresh data"));
    }
});

// ==================== ERROR HANDLERS ====================

// Error Handler
app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    if (err instanceof multer.MulterError) {
        return res.status(400).json(errorResponse("Upload error: " + err.message));
    }
    res.status(500).json(errorResponse(err.message || "Internal server error"));
});

// 404 Handler - MUST BE LAST BEFORE SERVER START
app.use((req, res) => {
    res.status(404).json(errorResponse("Route not found: " + req.method + " " + req.url));
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
    console.log("");
    console.log("========================================");
    console.log("🚀 Server is running!");
    console.log("📡 URL: http://localhost:" + PORT);
    console.log("🔑 API Key: " + (process.env.GEMINI_API_KEY ? "✅ Loaded" : "❌ Missing"));
    console.log("📁 Uploads: " + uploadsDir);
    console.log("📊 ML Integration: Ready");
    console.log("========================================");
    console.log("");
    console.log("📋 Available ML Endpoints:");
    console.log("   GET  /api/ml/status - Check ML service health");
    console.log("   POST /api/ml/advanced-analyze - Crisis-aware analysis");
    console.log("   POST /api/ml/rank-scraped-jobs - Rank jobs with ML");
    console.log("   GET  /api/ml/crisis-advice - Get market advice");
    console.log("========================================");
    console.log("");
});

module.exports = app;