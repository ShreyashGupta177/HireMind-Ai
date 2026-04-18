"""
Unified Web Scraper for LinkedIn, Internshala, and Naukri.com
"""

import requests
from bs4 import BeautifulSoup
import time
import json
import re
from datetime import datetime

class UnifiedJobScraper:
    def __init__(self, backend_url="http://localhost:5000"):
        self.backend_url = backend_url
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    def scrape_internshala(self, keyword):
        print(f"\n🔍 [Internshala] Searching for: {keyword}")
        jobs = []
        url = f"https://internshala.com/internships/keywords-{keyword}/"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                cards = soup.find_all('div', class_='internship_meta')
                
                for card in cards[:20]:
                    title_elem = card.find('h3', class_='heading_4_5')
                    company_elem = card.find('h4', class_='heading_6')
                    location_elem = card.find('a', class_='location_link')
                    stipend_elem = card.find('span', class_='stipend')
                    
                    job = {
                        "title": title_elem.text.strip() if title_elem else "N/A",
                        "company": company_elem.text.strip() if company_elem else "N/A",
                        "location": location_elem.text.strip() if location_elem else "N/A",
                        "stipend": stipend_elem.text.strip() if stipend_elem else "Not specified",
                        "platform": "Internshala",
                        "skills": [keyword.title()]
                    }
                    jobs.append(job)
            
            print(f"   ✅ Found {len(jobs)} internships")
        except Exception as e:
            print(f"   ⚠️ Error: {str(e)}")
        
        return jobs
    
    def scrape_linkedin(self, keyword, location="India"):
        print(f"\n🔍 [LinkedIn] Searching for: {keyword}")
        jobs = []
        keyword_fmt = keyword.lower().replace(' ', '%20')
        location_fmt = location.lower().replace(' ', '%20')
        url = f"https://www.linkedin.com/jobs/search/?keywords={keyword_fmt}&location={location_fmt}"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                cards = soup.find_all('div', class_='base-card')
                
                for card in cards[:20]:
                    title_elem = card.find('h3', class_='base-search-card__title')
                    company_elem = card.find('h4', class_='base-search-card__subtitle')
                    location_elem = card.find('span', class_='job-search-card__location')
                    
                    job = {
                        "title": title_elem.text.strip() if title_elem else "N/A",
                        "company": company_elem.text.strip() if company_elem else "N/A",
                        "location": location_elem.text.strip() if location_elem else "N/A",
                        "platform": "LinkedIn",
                        "skills": [keyword.title()]
                    }
                    jobs.append(job)
            
            print(f"   ✅ Found {len(jobs)} jobs")
        except Exception as e:
            print(f"   ⚠️ Error: {str(e)}")
        
        return jobs
    
    def scrape_naukri(self, keyword):
        print(f"\n🔍 [Naukri] Searching for: {keyword}")
        jobs = []
        keyword_fmt = keyword.lower().replace(' ', '-')
        url = f"https://www.naukri.com/{keyword_fmt}-jobs"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                cards = soup.find_all('div', class_='jobTuple')
                
                for card in cards[:20]:
                    title_elem = card.find('a', class_='title')
                    company_elem = card.find('a', class_='subTitle')
                    location_elem = card.find('li', class_='location')
                    
                    job = {
                        "title": title_elem.text.strip() if title_elem else "N/A",
                        "company": company_elem.text.strip() if company_elem else "N/A",
                        "location": location_elem.text.strip() if location_elem else "N/A",
                        "platform": "Naukri",
                        "skills": [keyword.title()]
                    }
                    jobs.append(job)
            
            print(f"   ✅ Found {len(jobs)} jobs")
        except Exception as e:
            print(f"   ⚠️ Error: {str(e)}")
        
        return jobs
    
    def send_to_backend(self, jobs, platform):
        if not jobs:
            return
        
        payload = {
            "platform": platform,
            "jobs": jobs,
            "scraped_at": datetime.now().isoformat()
        }
        
        try:
            response = requests.post(f"{self.backend_url}/api/scrape/results", json=payload, timeout=30)
            if response.status_code == 200:
                print(f"✅ Sent {len(jobs)} {platform} jobs to backend")
        except Exception as e:
            print(f"❌ Failed to send: {str(e)}")
    
    def scrape_all(self, keywords):
        print("=" * 60)
        print("🚀 STARTING JOB SCRAPER")
        print("=" * 60)
        
        for keyword in keywords:
            print(f"\n📌 Processing: {keyword.upper()}")
            
            jobs = self.scrape_internshala(keyword)
            self.send_to_backend(jobs, 'internshala')
            time.sleep(2)
            
            jobs = self.scrape_linkedin(keyword)
            self.send_to_backend(jobs, 'linkedin')
            time.sleep(2)
            
            jobs = self.scrape_naukri(keyword)
            self.send_to_backend(jobs, 'naukri')
            time.sleep(3)
        
        print("\n✨ Scraping completed!")

if __name__ == "__main__":
    print("""
    ╔════════════════════════════════════════╗
    ║     UNIFIED JOB SCRAPER                ║
    ║     LinkedIn | Internshala | Naukri    ║
    ╚════════════════════════════════════════╝
    """)
    
    KEYWORDS = ['python', 'data-science', 'machine-learning']
    
    scraper = UnifiedJobScraper()
    scraper.scrape_all(KEYWORDS)