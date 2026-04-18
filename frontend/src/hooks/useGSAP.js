import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const useGSAP = (callback, deps = []) => {
  const ref = useRef()
  useEffect(() => {
    const ctx = gsap.context(() => {
      callback()
    }, ref)
    return () => ctx.revert()
  }, deps)
  return ref
}