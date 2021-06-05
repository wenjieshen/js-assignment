import * as PIXI from 'pixi.js'
import { StateCtrl } from './state'

const backgroundPath = 'assets/Green_3_gridbox.png'
const load = (app: PIXI.Application) => {
  return new Promise<void>((resolve) => {
    app.loader.add(backgroundPath).load(() => {
      resolve()
    })
  })
}

const main = async () => {
  // Actual app
  const app = new PIXI.Application()

  // Display application properly
  document.body.style.margin = '0'
  app.renderer.view.style.position = 'absolute'
  app.renderer.view.style.display = 'block'

  // View size = windows
  app.renderer.resize(window.innerWidth, window.innerHeight)

  // Load assets
  await load(app)
  const background = new PIXI.TilingSprite(
    app.loader.resources[backgroundPath].texture,
    window.innerWidth,
    window.innerWidth
  )
  background.tileScale.x *= 0.1
  background.tileScale.y *= 0.1
  app.stage.addChild(background)

  // Handle window resizing
  window.addEventListener('resize', (e) => {
    app.renderer.resize(window.innerWidth, window.innerHeight)
    background.width = window.innerWidth
    background.height = window.innerHeight
  })

  document.body.appendChild(app.view)

  /* const context = {
    velocity: { x: 1, y: 1 },
    sprite: background
  }

  app.ticker.add(update, context) */

  const stateCtrl = new StateCtrl()
  stateCtrl.injectApp(app)
}

// Cannot be an arrow function. Arrow functions cannot have a 'this' parameter.
/* function update (this: any, delta: number) {
  if (this.sprite.x <= 0 || this.sprite.x >= window.innerWidth - this.sprite.width) {
    this.velocity.x = -this.velocity.x
  }
  if (this.sprite.y <= 0 || this.sprite.y >= window.innerHeight - this.sprite.height) {
    this.velocity.y = -this.velocity.y
  }
  this.sprite.x += this.velocity.x
  this.sprite.y += this.velocity.y
}; */

main()
