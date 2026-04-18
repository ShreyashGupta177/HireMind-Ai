import { createContext, useContext, useState } from 'react'

const AppContext = createContext()

export const AppProvider = ({ children }) => {
  const [resumeText, setResumeText] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)

  return (
    <AppContext.Provider value={{
      resumeText, setResumeText,
      selectedJob, setSelectedJob,
      analysisResult, setAnalysisResult,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)