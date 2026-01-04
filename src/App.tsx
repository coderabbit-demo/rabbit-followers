import { useState, useEffect, useRef } from 'react'
import './App.css'

interface Rabbit {
  id: number
  x: number
  y: number
  speed: number
  isHovered: boolean
}

interface ExplosionParticle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  life: number
  emoji: string
}

interface Eagle {
  id: number
  x: number
  y: number
  speed: number
  targetRabbitId: number | null
  state: 'idle' | 'hunting' | 'eating'
}

interface Snake {
  id: number
  x: number
  y: number
}

interface Pond {
  id: number
  x: number
  y: number
  width: number
  height: number
}

/**
 * Main interactive React component that renders an animated scene of rabbits.
 *
 * Tracks mouse movement and animates rabbits to follow the cursor with subtle wobble
 * and small per-frame speed variation, while resolving pairwise collisions and
 * applying a hover scale when individual rabbits are hovered.
 *
 * @returns The component's JSX element containing the interactive rabbit scene
 */
function App() {
  const [rabbits, setRabbits] = useState<Rabbit[]>([
    { id: 1, x: 100, y: 100, speed: 0.008, isHovered: false },
    { id: 2, x: 200, y: 200, speed: 0.015, isHovered: false },
    { id: 3, x: 300, y: 150, speed: 0.012, isHovered: false },
    { id: 4, x: 400, y: 300, speed: 0.02, isHovered: false },
    { id: 5, x: 500, y: 250, speed: 0.01, isHovered: false },
    { id: 6, x: 150, y: 400, speed: 0.025, isHovered: false },
    { id: 7, x: 350, y: 350, speed: 0.018, isHovered: false },
    { id: 8, x: 450, y: 150, speed: 0.022, isHovered: false },
    { id: 9, x: 250, y: 300, speed: 0.016, isHovered: false },
  ])

  const [isPaused, setIsPaused] = useState(false)
  const [explosionParticles, setExplosionParticles] = useState<ExplosionParticle[]>([])
  const [eagle, setEagle] = useState<Eagle>({
    id: 1,
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    speed: 0.035,
    targetRabbitId: null,
    state: 'idle'
  })
  const [snake] = useState<Snake>({
    id: 1,
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight
  })
  const [pond] = useState<Pond>({
    id: 1,
    x: window.innerWidth / 2 - 75,
    y: window.innerHeight / 2 + 100,
    width: 150,
    height: 100
  })
  const mousePosRef = useRef({ x: 0, y: 0 })
  const rabbitsRef = useRef(rabbits)
  const explosionParticlesRef = useRef(explosionParticles)
  const eagleRef = useRef(eagle)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const explodedRabbitsRef = useRef(new Set<number>())

  // Keep refs in sync with state
  useEffect(() => {
    rabbitsRef.current = rabbits
  }, [rabbits])

  useEffect(() => {
    explosionParticlesRef.current = explosionParticles
  }, [explosionParticles])

  useEffect(() => {
    eagleRef.current = eagle
  }, [eagle])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    // Font size is 2rem = 32px, so radius is approximately half of that
    const BASE_RABBIT_RADIUS = 16 // Half of the emoji's rendered size (2rem/2)
    const HOVER_SCALE = 1.2 // Scale factor from CSS hover state

    const checkCollision = (rabbit1: Rabbit, rabbit2: Rabbit) => {
      // Compute effective radius for each rabbit based on hover state
      const radius1 = BASE_RABBIT_RADIUS * (rabbit1.isHovered ? HOVER_SCALE : 1)
      const radius2 = BASE_RABBIT_RADIUS * (rabbit2.isHovered ? HOVER_SCALE : 1)
      
      const dx = rabbit1.x - rabbit2.x
      const dy = rabbit1.y - rabbit2.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      return distance < radius1 + radius2
    }

    const resolveCollisions = (rabbits: Rabbit[]) => {
      const resolvedRabbits = [...rabbits]

      for (let i = 0; i < resolvedRabbits.length; i++) {
        for (let j = i + 1; j < resolvedRabbits.length; j++) {
          const rabbit1 = resolvedRabbits[i]
          const rabbit2 = resolvedRabbits[j]

          if (checkCollision(rabbit1, rabbit2)) {
            // Compute effective radii for collision resolution
            const radius1 = BASE_RABBIT_RADIUS * (rabbit1.isHovered ? HOVER_SCALE : 1)
            const radius2 = BASE_RABBIT_RADIUS * (rabbit2.isHovered ? HOVER_SCALE : 1)
            
            const dx = rabbit2.x - rabbit1.x
            const dy = rabbit2.y - rabbit1.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance === 0) continue // Skip if rabbits are at exact same position

            const overlap = radius1 + radius2 - distance
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


    const createEatingEffect = (x: number, y: number) => {
      const particleEmojis = ['🪶', '💨', '✨', '💫', '☁️']
      const bloodEmojis = ['🩸', '💉', '🔴']
      const newParticles: ExplosionParticle[] = []

      // Add blood splatter particles
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20
        const speed = 3 + Math.random() * 4
        newParticles.push({
          id: `blood-${Date.now()}-${i}`,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          emoji: bloodEmojis[Math.floor(Math.random() * bloodEmojis.length)]
        })
      }

      // Add some feather particles
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8
        const speed = 1.5 + Math.random() * 2.5
        newParticles.push({
          id: `eating-${Date.now()}-${i}`,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1, // Slight upward bias
          life: 1,
          emoji: particleEmojis[Math.floor(Math.random() * particleEmojis.length)]
        })
      }

      setExplosionParticles(prev => [...prev, ...newParticles])
    }

    const createDrowningEffect = (x: number, y: number) => {
      const particleEmojis = ['💧', '💦', '🌊', '💙', '🫧']
      const newParticles: ExplosionParticle[] = []

      // Add water splash particles
      for (let i = 0; i < 25; i++) {
        const angle = (Math.PI * 2 * i) / 25
        const speed = 2 + Math.random() * 3.5
        newParticles.push({
          id: `drowning-${Date.now()}-${i}`,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2, // Strong upward splash
          life: 1,
          emoji: particleEmojis[Math.floor(Math.random() * particleEmojis.length)]
        })
      }

      setExplosionParticles(prev => [...prev, ...newParticles])
    }

    const animate = () => {
      if (isPaused) {
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }

      const mousePos = mousePosRef.current
      const currentRabbits = rabbitsRef.current
      const currentEagle = eagleRef.current
      const EAGLE_COLLISION_RADIUS = 25
      const SNAKE_COLLISION_RADIUS = 30

      const newRabbits = currentRabbits.map((rabbit) => {
        const dx = mousePos.x - rabbit.x
        const dy = mousePos.y - rabbit.y

        // Add subtle random wobble to make movement less uniform
        const wobbleX = (Math.random() - 0.5) * 0.3
        const wobbleY = (Math.random() - 0.5) * 0.3

        // Add minimal random variation to speed for this frame
        const speedVariation = 1 + (Math.random() - 0.5) * 0.05

        return {
          ...rabbit,
          x: rabbit.x + dx * rabbit.speed * speedVariation + wobbleX,
          y: rabbit.y + dy * rabbit.speed * speedVariation + wobbleY,
        }
      })

      const resolvedRabbits = resolveCollisions(newRabbits)

      // Check for snake collisions
      resolvedRabbits.forEach((rabbit) => {
        if (!explodedRabbitsRef.current.has(rabbit.id)) {
          const dx = rabbit.x - snake.x
          const dy = rabbit.y - snake.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < SNAKE_COLLISION_RADIUS) {
            // Rabbit hit the snake!
            explodedRabbitsRef.current.add(rabbit.id)
            createExplosion(rabbit.x, rabbit.y)
          }
        }
      })

      // Check for pond collisions
      resolvedRabbits.forEach((rabbit) => {
        if (!explodedRabbitsRef.current.has(rabbit.id)) {
          // Check if rabbit is inside pond bounds
          if (
            rabbit.x >= pond.x &&
            rabbit.x <= pond.x + pond.width &&
            rabbit.y >= pond.y &&
            rabbit.y <= pond.y + pond.height
          ) {
            // Rabbit drowned in the pond!
            explodedRabbitsRef.current.add(rabbit.id)
            createDrowningEffect(rabbit.x, rabbit.y)
          }
        }
      })

      // Filter out exploded rabbits from the state
      const aliveRabbits = resolvedRabbits.filter(r => !explodedRabbitsRef.current.has(r.id))
      setRabbits(aliveRabbits)

      // Eagle behavior
      let newEagle = { ...currentEagle }

      if (currentEagle.state === 'hunting' && currentEagle.targetRabbitId !== null) {
        // Find target rabbit
        const targetRabbit = resolvedRabbits.find(r => r.id === currentEagle.targetRabbitId)

        // Check if target still exists (wasn't exploded)
        if (targetRabbit && !explodedRabbitsRef.current.has(currentEagle.targetRabbitId)) {
          // Move eagle toward target
          const dx = targetRabbit.x - currentEagle.x
          const dy = targetRabbit.y - currentEagle.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          // Check if eagle caught the rabbit
          if (distance < EAGLE_COLLISION_RADIUS) {
            // Eagle caught the rabbit!
            newEagle = {
              ...currentEagle,
              x: targetRabbit.x,
              y: targetRabbit.y,
              state: 'eating',
              targetRabbitId: null
            }

            // Mark rabbit as exploded and create eating particles
            explodedRabbitsRef.current.add(currentEagle.targetRabbitId)
            createEatingEffect(targetRabbit.x, targetRabbit.y)

            // Return to idle after eating animation
            setTimeout(() => {
              setEagle(prev => ({ ...prev, state: 'idle' }))
            }, 500)
          } else {
            // Move toward target
            newEagle = {
              ...currentEagle,
              x: currentEagle.x + (dx / distance) * currentEagle.speed * distance,
              y: currentEagle.y + (dy / distance) * currentEagle.speed * distance
            }
          }
        } else {
          // Target was exploded by cursor or doesn't exist, return to idle
          newEagle = {
            ...currentEagle,
            state: 'idle',
            targetRabbitId: null
          }
        }
      } else if (currentEagle.state === 'idle') {
        // Idle hovering animation
        const time = Date.now() * 0.001
        newEagle = {
          ...currentEagle,
          x: currentEagle.x + Math.sin(time) * 0.5,
          y: currentEagle.y + Math.cos(time * 1.3) * 0.3
        }
      }

      setEagle(newEagle)

      // Update explosion particles
      const currentParticles = explosionParticlesRef.current
      const updatedParticles = currentParticles
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.2, // Gravity
          life: particle.life - 0.02
        }))
        .filter(particle => particle.life > 0)

      if (updatedParticles.length !== currentParticles.length || updatedParticles.length > 0) {
        setExplosionParticles(updatedParticles)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPaused])

  const handleRabbitHover = (id: number, isHovered: boolean) => {
    setRabbits((prevRabbits) =>
      prevRabbits.map((rabbit) =>
        rabbit.id === id ? { ...rabbit, isHovered } : rabbit
      )
    )
  }

  const handleRabbitClick = (id: number) => {
    // Only set target if rabbit hasn't been exploded
    if (!explodedRabbitsRef.current.has(id)) {
      setEagle(prev => ({
        ...prev,
        targetRabbitId: id,
        state: 'hunting'
      }))
    }
  }

  return (
    <div className="app">
      <h1 className="title">Move your mouse around!</h1>
      <button
        className="pause-button"
        onClick={() => setIsPaused(!isPaused)}
        aria-label={isPaused ? "Play animation" : "Pause animation"}
      >
        {isPaused ? '▶️' : '⏸️'}
      </button>
      <div className="rabbit-container">
        {rabbits.map((rabbit) => (
          <div
            key={rabbit.id}
            className="rabbit"
            style={{
              left: `${rabbit.x}px`,
              top: `${rabbit.y}px`,
            }}
            onMouseEnter={() => handleRabbitHover(rabbit.id, true)}
            onMouseLeave={() => handleRabbitHover(rabbit.id, false)}
            onClick={() => handleRabbitClick(rabbit.id)}
          >
            🐰
          </div>
        ))}
        {explosionParticles.map((particle) => (
          <div
            key={particle.id}
            className="explosion-particle"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              opacity: particle.life,
            }}
          >
            {particle.emoji}
          </div>
        ))}
        <div
          className="pond"
          style={{
            left: `${pond.x}px`,
            top: `${pond.y}px`,
            width: `${pond.width}px`,
            height: `${pond.height}px`,
          }}
        />
        <div
          className={`eagle ${eagle.state}`}
          style={{
            left: `${eagle.x}px`,
            top: `${eagle.y}px`,
          }}
        >
          🦅
        </div>
        <div
          className="snake"
          style={{
            left: `${snake.x}px`,
            top: `${snake.y}px`,
          }}
        >
          🐍
        </div>
      </div>
    </div>
  )
}

export default App