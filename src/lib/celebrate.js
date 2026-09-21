import confetti from 'canvas-confetti'

// Confeti al completar una tarea (arrastrando a Hecho o con el botón de hecho)
export function celebrate() {
  confetti({
    particleCount: 90,
    spread: 75,
    origin: { y: 0.65 },
    colors: ['#2563EB', '#22D3EE', '#8B5CF6'],
  })
}
