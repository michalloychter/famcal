// Simple confetti animation for Angular component
// Usage: import and call Confetti.start() when modal opens, Confetti.stop() to clear

export class Confetti {
  private static canvas: HTMLCanvasElement | null = null;
  private static ctx: CanvasRenderingContext2D | null = null;
  private static particles: any[] = [];
  private static animationId: number | null = null;
  private static running = false;

  static start() {
    if (this.running) return;
    this.running = true;
    this.createCanvas();
    this.particles = this.createParticles(120);
    this.animate();
  }

  static stop() {
    this.running = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
    // Don't remove canvas - leave confetti frozen on screen as static background
    // Just stop the animation loop
    this.animationId = null;
  }

  static clear() {
    // New method to fully clear confetti when needed
    this.running = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationId = null;
  }

  private static createCanvas() {
    if (this.canvas) return;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'confetti-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '2000';
    document.body.appendChild(this.canvas);
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas.bind(this));
    this.ctx = this.canvas.getContext('2d');
  }

  private static resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private static createParticles(count: number) {
    const colors = ['#fbbf24', '#f472b6', '#60a5fa', '#34d399', '#f87171', '#a78bfa', '#facc15'];
    const particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * -window.innerHeight,
        r: 6 + Math.random() * 8,
        d: Math.random() * count,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 10,
        tiltAngle: 0,
        tiltAngleIncremental: (Math.random() * 0.07) + 0.05
      });
    }
    return particles;
  }

  private static animate() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      this.ctx.beginPath();
      this.ctx.lineWidth = p.r;
      this.ctx.strokeStyle = p.color;
      this.ctx.moveTo(p.x + p.tilt + p.r / 3, p.y);
      this.ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 3);
      this.ctx.stroke();
    }
    this.updateParticles();
    if (this.running) {
      this.animationId = requestAnimationFrame(this.animate.bind(this));
    }
  }

  private static updateParticles() {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
      p.x += Math.sin(0.01 * p.d);
      p.tiltAngle += p.tiltAngleIncremental;
      p.tilt = Math.sin(p.tiltAngle) * 15;
      if (p.y > window.innerHeight) {
        p.x = Math.random() * window.innerWidth;
        p.y = -10;
      }
    }
  }
}
