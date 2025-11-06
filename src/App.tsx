import { useState, useEffect, useRef } from 'react'
import './App.css'

interface Rabbit {
  id: number
  x: number
  y: number
  speed: number
}

function App() {
  const [rabbits, setRabbits] = useState<Rabbit[]>([
    { id: 1, x: 100, y: 100, speed: 0.05 },
    { id: 2, x: 200, y: 200, speed: 0.08 },
    { id: 3, x: 300, y: 150, speed: 0.06 },
    { id: 4, x: 400, y: 300, speed: 0.07 },
    { id: 5, x: 500, y: 250, speed: 0.04 },
    { id: 6, x: 150, y: 400, speed: 0.09 },
    { id: 7, x: 350, y: 350, speed: 0.055 },
    { id: 8, x: 450, y: 150, speed: 0.075 },
  ])

  const mousePosRef = useRef({ x: 0, y: 0 })
  const rabbitsRef = useRef(rabbits)
  const animationFrameRef = useRef<number>()

  // Keep rabbitsRef in sync with rabbits state
  useEffect(() => {
    rabbitsRef.current = rabbits
  }, [rabbits])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const animate = () => {
      const mousePos = mousePosRef.current
      const currentRabbits = rabbitsRef.current

      const newRabbits = currentRabbits.map((rabbit) => {
        const dx = mousePos.x - rabbit.x
        const dy = mousePos.y - rabbit.y

        return {
          ...rabbit,
          x: rabbit.x + dx * rabbit.speed,
          y: rabbit.y + dy * rabbit.speed,
        }
      })

      setRabbits(newRabbits)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <div className="app">
      <h1 className="title">Move your mouse around!</h1>
      <div className="rabbit-container">
        {rabbits.map((rabbit) => (
          <div
            key={rabbit.id}
            className="rabbit"
            style={{
              left: `${rabbit.x}px`,
              top: `${rabbit.y}px`,
            }}
          >
            🐰
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
