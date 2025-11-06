import { useState, useEffect } from 'react'
import './App.css'

interface Rabbit {
  id: number
  x: number
  y: number
  speed: number
}

function App() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setRabbits((prevRabbits) =>
        prevRabbits.map((rabbit) => {
          const dx = mousePos.x - rabbit.x
          const dy = mousePos.y - rabbit.y

          return {
            ...rabbit,
            x: rabbit.x + dx * rabbit.speed,
            y: rabbit.y + dy * rabbit.speed,
          }
        })
      )
    }, 16) // ~60 FPS

    return () => clearInterval(interval)
  }, [mousePos])

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
