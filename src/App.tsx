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
    { id: 1, x: 100, y: 100, speed: 0.008 },
    { id: 2, x: 200, y: 200, speed: 0.015 },
    { id: 3, x: 300, y: 150, speed: 0.012 },
    { id: 4, x: 400, y: 300, speed: 0.02 },
    { id: 5, x: 500, y: 250, speed: 0.01 },
    { id: 6, x: 150, y: 400, speed: 0.025 },
    { id: 7, x: 350, y: 350, speed: 0.018 },
    { id: 8, x: 450, y: 150, speed: 0.022 },
  ])

  const mousePosRef = useRef({ x: 0, y: 0 })
  const rabbitsRef = useRef(rabbits)
  const animationFrameRef = useRef<number | undefined>(undefined)

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
    // Font size is 2rem = 32px, so radius is approximately half of that
    const RABBIT_RADIUS = 16 // Half of the emoji's rendered size (2rem/2)

    const checkCollision = (rabbit1: Rabbit, rabbit2: Rabbit) => {
      const dx = rabbit1.x - rabbit2.x
      const dy = rabbit1.y - rabbit2.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      return distance < RABBIT_RADIUS * 2
    }

    const resolveCollisions = (rabbits: Rabbit[]) => {
      const resolvedRabbits = [...rabbits]

      for (let i = 0; i < resolvedRabbits.length; i++) {
        for (let j = i + 1; j < resolvedRabbits.length; j++) {
          const rabbit1 = resolvedRabbits[i]
          const rabbit2 = resolvedRabbits[j]

          if (checkCollision(rabbit1, rabbit2)) {
            const dx = rabbit2.x - rabbit1.x
            const dy = rabbit2.y - rabbit1.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance === 0) continue // Skip if rabbits are at exact same position

            const overlap = RABBIT_RADIUS * 2 - distance
            const moveX = (dx / distance) * overlap * 0.5
            const moveY = (dy / distance) * overlap * 0.5

            resolvedRabbits[i] = {
              ...rabbit1,
              x: rabbit1.x - moveX,
              y: rabbit1.y - moveY,
            }

            resolvedRabbits[j] = {
              ...rabbit2,
              x: rabbit2.x + moveX,
              y: rabbit2.y + moveY,
            }
          }
        }
      }

      return resolvedRabbits
    }

    const animate = () => {
      const mousePos = mousePosRef.current
      const currentRabbits = rabbitsRef.current

      const newRabbits = currentRabbits.map((rabbit) => {
        const dx = mousePos.x - rabbit.x
        const dy = mousePos.y - rabbit.y

        // Add random wobble to make movement less uniform
        const wobbleX = (Math.random() - 0.5) * 2
        const wobbleY = (Math.random() - 0.5) * 2

        // Add slight random variation to speed for this frame
        const speedVariation = 1 + (Math.random() - 0.5) * 0.3

        return {
          ...rabbit,
          x: rabbit.x + dx * rabbit.speed * speedVariation + wobbleX,
          y: rabbit.y + dy * rabbit.speed * speedVariation + wobbleY,
        }
      })

      const resolvedRabbits = resolveCollisions(newRabbits)
      setRabbits(resolvedRabbits)
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
