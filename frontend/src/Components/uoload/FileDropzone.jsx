import { useDropzone } from 'react-dropzone'
import { Upload, FileText } from 'lucide-react'
import clsx from 'clsx'

export default function FileDropzone({ onFileAccepted, isLoading }) {
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxSize: 2 * 1024 * 1024,
    onDropAccepted: (files) => onFileAccepted(files[0]),
  })

  return (
    <div
      {...getRootProps()}
      className={clsx(
        'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300',
        isDragActive ? 'border-primary-purple bg-primary-purple/10' : 'border-white/20 hover:border-primary-purple/50',
        isLoading && 'opacity-50 pointer-events-none'
      )}
    >
      <input {...getInputProps()} />
      <Upload size={40} className="mx-auto text-primary-purple mb-4" />
      {acceptedFiles.length > 0 ? (
        <div className="flex items-center justify-center gap-2 text-white">
          <FileText size={18} /> {acceptedFiles[0].name}
        </div>
      ) : (
        <>
          <p className="text-white font-medium">Drag & drop your resume</p>
          <p className="text-white/50 text-sm mt-2">PDF or DOCX (max 2MB)</p>
        </>
      )}
    </div>
  )
}