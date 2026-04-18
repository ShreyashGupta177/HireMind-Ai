"""
AI Career Coach - Crisis Mode ML Service
Integrated with Job Portal Backend
"""

import os
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List as PyList
import uvicorn
from datetime import datetime

# ============ Configuration ============
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your-openai-api-key-here")
if OPENAI_API_KEY == "your-openai-api-key-here":
    print("⚠️ WARNING: Please set your OPENAI_API_KEY environment variable")

# ============ Crisis Mode Logic ============
CRISIS_MODE_LOGIC = """
If Market_Condition is 'CRISIS' (War/Pandemic/Economic Downturn):
1. Prioritize 'Recession-Proof' roles: Cloud Engineering, Cybersecurity, AI Automation, Healthcare Tech.
2. Weight 'Remote Work' skills (Async Communication, Docker, Git) 50% higher.
3. If the user's current industry is high-risk (e.g., Travel/Hospitality), suggest an 'Emergency Pivot' roadmap to a stable tech role.
4. Focus on 'Quick Wins': Certifications over degrees, portfolio projects over experience.
5. Emergency Skills: Basic coding, data analysis, digital marketing for immediate job transitions.
"""

# ============ Enhanced Schema with Learning Roadmaps ============
class LearningResource(BaseModel):
    skill: str = Field(description="The missing skill name")
    platform: str = Field(description="Suggested platform (e.g., Coursera, YouTube, Udemy)")
    learning_link: str = Field(description="Direct URL to a high-quality course or documentation")
    estimated_time: str = Field(description="Time to learn (e.g., '2 weeks', '1 month')")

class JobRanking(BaseModel):
    job_title: str = Field(description="Job position title")
    source: str = Field(description="Platform source (LinkedIn, Naukri, etc.)")
    match_score: int = Field(description="Match score from 0-100")
    reasoning: str = Field(description="Why this job fits the candidate")
    learning_roadmap: List[LearningResource] = Field(description="Skills needed to qualify")

class AnalysisResult(BaseModel):
    match_score: int = Field(description="Match score from 0-100")
    missing_skills: List[str] = Field(description="Skills present in JD but not in Resume")
    keyword_alignment: List[str] = Field(description="Keywords to add for ATS optimization")
    reasoning: str = Field(description="Explanation of fit, including transferable skills for job switching")
    tailored_summary: str = Field(description="A professional summary for this specific job")
    recommendation: str = Field(description="Actionable advice (Apply/Skip/Upskill)")
    learning_roadmap: List[LearningResource] = Field(description="Personalized learning links to bridge the gap")
    crisis_mode_advice: str = Field(description="Market-aware career advice considering economic conditions")

# ============ Domain Knowledge (Crisis-Aware) ============
ML_DOMAIN_KNOWLEDGE = """
### CRITICAL SKILL HIERARCHY:
- TIER 1 (Modern AI/MLOps): Generative AI, LLMs, RAG, LangChain, MLOps, Docker, FastAPI.
- TIER 2 (Core Frameworks): PyTorch, TensorFlow, HuggingFace, Scikit-learn.
- TIER 3 (Data Science): Feature Engineering, EDA, Statistical Analysis, Pandas, NumPy.
- CRISIS-PROOF SKILLS: Cloud (AWS/GCP), Cybersecurity, DevOps, Remote Work Tools.

### PREFERRED LEARNING SOURCES:
- GenAI/LLMs: DeepLearning.AI, LangChain Documentation, freeCodeCamp.
- MLOps: TechWorld with Nana (YouTube), Docker Official Docs.
- Crisis Skills: AWS Free Tier, Google Cloud Skills Boost, Cybersecurity certifications.
"""

# ============ Initialize Components ============
llm = ChatOpenAI(model="gpt-4-turbo", temperature=0.2, api_key=OPENAI_API_KEY)
parser = JsonOutputParser(pydantic_object=AnalysisResult)

# ============ Crisis Detection ============
def detect_market_condition(current_year=2025):
    """Detect if we're in crisis mode based on current conditions"""
    crisis_years = [2020, 2022, 2023, 2024]
    return "CRISIS" if current_year in crisis_years else "NORMAL"

# ============ Recommendation Logic ============
def add_recommendation(analysis_result):
    """Add recommendation based on match score and market conditions"""
    score = analysis_result.get('match_score', 0)
    market_condition = detect_market_condition()

    if market_condition == "CRISIS":
        if score >= 70:
            recommendation = "Crisis Priority: Apply immediately - stable tech roles scarce"
        elif score >= 40:
            recommendation = "Crisis Upskill: Focus on recession-proof skills (Cloud, Security)"
        else:
            recommendation = "Crisis Pivot: Emergency transition to high-demand tech roles"
    else:
        if score >= 80:
            recommendation = "Strong Match: Priority Apply"
        elif score >= 50:
            recommendation = "Potential Match: Upskill & Apply"
        else:
            recommendation = "Gap Too Wide: Focus on Learning"

    analysis_result['recommendation'] = recommendation
    return analysis_result

# ============ Enhanced Analysis with Crisis Awareness ============
def analyze_career_fit(resume, jd, target_goal="Job Match", market_condition=None):
    """Crisis-aware analysis with learning roadmaps and career switching logic"""

    if market_condition is None:
        market_condition = detect_market_condition()

    system_prompt = f"""
You are an AI Career Coach and Crisis Management Specialist.
Current Market Condition: {market_condition}

### CRISIS MODE LOGIC:
{CRISIS_MODE_LOGIC}

### KNOWLEDGE BASE:
{ML_DOMAIN_KNOWLEDGE}

### EVALUATION RULES:
1. TRANSFERABLE SKILLS: Identify logical overlaps for career switching (e.g., C/C++ → optimized ML logic).
2. CRISIS PRIORITIES: In crisis mode, weight remote work skills and recession-proof technologies higher.
3. LEARNING ROADMAP: For EVERY skill in 'missing_skills', provide a 'LearningResource' with platform, link, and time estimate.
4. EMERGENCY PIVOT: If current industry is high-risk, suggest immediate transition to stable tech roles.

### OUTPUT REQUIREMENTS:
- Include crisis_mode_advice field with market-aware recommendations
- Provide realistic learning timelines
- Focus on high-ROI skills during economic uncertainty

Return a valid JSON object.
"""
    user_content = "Resume: {resume_text}\n\nJob Description: {jd_text}\n\nTarget Goal: {target_goal}"

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("user", user_content)
    ])

    chain = prompt | llm | parser
    try:
        response = chain.invoke({
            "resume_text": resume,
            "jd_text": jd,
            "target_goal": target_goal
        })
        return add_recommendation(response)
    except Exception as e:
        return {"error": str(e), "match_score": 0, "missing_skills": [], "keyword_alignment": [], "reasoning": f"Analysis failed: {str(e)}", "tailored_summary": "", "recommendation": "Try again", "learning_roadmap": [], "crisis_mode_advice": "Service temporarily unavailable"}

# ============ Multi-Source Job Ranking (Crisis-Aware) ============
def rank_external_jobs(resume, scraped_jobs: List[Dict], market_condition=None):
    """
    Ranks jobs from LinkedIn, Internshala, Naukri etc. with crisis awareness.
    """
    if market_condition is None:
        market_condition = detect_market_condition()

    ranked_results = []
    crisis_proof_keywords = ['cloud', 'cybersecurity', 'devops', 'ai', 'automation', 'remote', 'python', 'aws', 'docker', 'kubernetes']

    for job in scraped_jobs[:20]:  # Analyze top 20 jobs
        # Create job description from available data
        job_desc = job.get('description', '') or f"{job.get('title', '')} position at {job.get('company', 'Unknown')}. Skills required: {', '.join(job.get('skills', []))}"
        
        analysis = analyze_career_fit(
            resume,
            job_desc,
            target_goal="Career Transition",
            market_condition=market_condition
        )

        # Crisis mode bonus for stable tech roles
        bonus_score = 0
        if market_condition == "CRISIS":
            job_text = (job.get('title', '') + job_desc).lower()
            if any(keyword in job_text for keyword in crisis_proof_keywords):
                bonus_score = 15

        final_score = min(100, analysis.get('match_score', 0) + bonus_score)

        ranked_results.append({
            "job_title": job.get('title', 'N/A'),
            "company": job.get('company', 'N/A'),
            "location": job.get('location', 'N/A'),
            "source": job.get('platform', job.get('source', 'Unknown')),
            "match_score": final_score,
            "crisis_bonus": bonus_score,
            "reasoning": analysis.get('reasoning', 'Analysis available'),
            "missing_skills": analysis.get('missing_skills', []),
            "learning_roadmap": analysis.get('learning_roadmap', []),
            "crisis_mode_advice": analysis.get('crisis_mode_advice', '')
        })

    return sorted(ranked_results, key=lambda x: x['match_score'], reverse=True)

# ============ FastAPI Application ============
app = FastAPI(
    title="AI Career Coach - Crisis Mode",
    description="Crisis-aware resume analyzer with learning roadmaps for job portal",
    version="2.0.0"
)

# Add CORS middleware for backend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:3000", "http://localhost:5500", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JobRequest(BaseModel):
    resume_text: str = Field(description="Resume content")
    jd_text: str = Field(description="Job description content")
    market_condition: Optional[str] = Field(default=None, description="Market condition (CRISIS/NORMAL)")

class JobRankingRequest(BaseModel):
    resume_text: str
    scraped_jobs: List[Dict]

class HealthResponse(BaseModel):
    status: str
    market_condition: str
    model_loaded: bool
    version: str
    timestamp: str

# ============ API Endpoints ============

@app.get("/")
async def root():
    market_condition = detect_market_condition()
    return {
        "message": "AI Career Coach - Crisis Mode Activated",
        "market_condition": market_condition,
        "version": "2.0.0",
        "status": "operational",
        "endpoints": {
            "health": "/health (GET)",
            "analyze": "/analyze (POST)",
            "rank_jobs": "/rank-jobs (POST)",
            "docs": "/docs"
        }
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for backend integration"""
    return HealthResponse(
        status="healthy",
        market_condition=detect_market_condition(),
        model_loaded=True,
        version="2.0.0",
        timestamp=datetime.now().isoformat()
    )

@app.post("/analyze")
async def get_analysis(request: JobRequest):
    """Basic crisis-aware analysis for single job"""
    result = analyze_career_fit(
        request.resume_text,
        request.jd_text,
        market_condition=request.market_condition
    )
    return result

@app.post("/rank-jobs")
async def rank_jobs_endpoint(request: JobRankingRequest):
    """Rank external jobs with crisis awareness for backend integration"""
    result = rank_external_jobs(request.resume_text, request.scraped_jobs)
    return {
        "ranked_jobs": result,
        "total_analyzed": len(result),
        "market_condition": detect_market_condition(),
        "timestamp": datetime.now().isoformat()
    }

# ============ Main Execution ============
if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║     AI Career Coach - Crisis Mode ML Service            ║
    ║     Integrated with Job Portal Backend                  ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    market_condition = detect_market_condition()
    print(f"📊 Market Condition: {market_condition}")
    print(f"🔑 OpenAI API Key: {'✅ Loaded' if OPENAI_API_KEY != 'your-openai-api-key-here' else '❌ Missing'}")
    print(f"🚀 Starting server on http://localhost:8000")
    print(f"📚 API Docs: http://localhost:8000/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")