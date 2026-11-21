// main: boots the Harbour Dawn scene — title, HUD, panels, input.
import { SpotGame } from './engine.js';
import { SCENE, CONFIG } from './scene.js';

const elements = {
  panelLeft: document.getElementById('panelLeft'),
  panelRight: document.getElementById('panelRight'),
  foundCount: document.getElementById('foundCount'),
  scoreValue: document.getElementById('scoreValue'),
  timeValue: document.getElementById('timeValue'),
  hintValue: document.getElementById('hintValue'),
  timeBar: document.getElementById('timeBar'),
  messageBar: document.getElementById('messageBar'),
  status: document.getElementById('status'),
  hintButton: document.getElementById('hintButton'),
  soundButton: document.getElementById('soundButton'),
  restartButton: document.getElementById('restartButton'),
  overlay: document.getElementById('overlay'),
  overlayTitle: document.getElementById('overlayTitle'),
  overlayText: document.getElementById('overlayText'),
  overlayStats: document.getElementById('overlayStats'),
  overlayButton: document.getElementById('overlayButton'),
  lens: document.getElementById('lens'),
  lensCanvas: document.getElementById('lensCanvas'),
};

document.title = SCENE.title;
document.getElementById('gameTitle').textContent = SCENE.title;
document.getElementById('gameSubtitle').textContent = SCENE.subtitle;

export const game = new SpotGame(CONFIG, SCENE, elements);
game.bindEvents();

const shot = new URLSearchParams(window.location.search).get('shot');
if (shot === 'play' || shot === 'win' || shot === 'start') {
  game.stageForShot(shot);
} else {
  game.stageForShot('start');
}
game.run();
