export type Language = 'en' | 'pt';

export interface Translations {
  // Main Menu
  title: string;
  tagline: string;
  startGame: string;
  howToPlay: string;
  instructions: string[];
  controls: string;
  controlsDesktop: string;
  controlsMobile: string;
  language: string;

  // HUD
  score: string;
  lives: string;
  time: string;
  delivery: string;
  deliveries: string;
  combo: string;

  // Gameplay messages
  pickupReady: string;
  pickupTip: string;
  deliverHere: string;
  deliverTip: string;
  packageDropped: string;
  nearMiss: string;
  watchOut: string;
  ouch: string;
  tooSlow: string;
  windGust: string;
  splat: string;

  // Delivery feedback
  delivered: string;
  speedBonus: string;
  comboBonus: string;
  perfect: string;
  great: string;
  good: string;
  timeBonus: string;

  // Pause
  paused: string;
  resume: string;
  restart: string;
  mainMenu: string;

  // Game Over
  gameOver: string;
  finalScore: string;
  deliveriesCompleted: string;
  bestCombo: string;
  tryAgain: string;
  newGame: string;
  playAgain: string;
  highScore: string;

  // Chaos events
  trafficJam: string;
  puddle: string;
  construction: string;
  pedScatter: string;

  // Win / progress
  levelUp: string;
  cityExpert: string;

  // Misc
  pressToPickup: string;
  pressToDeliver: string;
  tapToPickup: string;
  tapToDeliver: string;
  getReady: string;
  go: string;
  timeSurvived: string;
  bestStage: string;
  shop: string;
  back: string;
  equipped: string;
  equip: string;
  confirm: string;
  shopHint: string;
  trophiesEarned: string;
  totalEarned: string;
  bestTime: string;
  gamesPlayed: string;
  newRecord: string;
}

const en: Translations = {
  title: 'Delivery of Chaos',
  tagline: 'The city is counting on you. (It really shouldn\'t be.)',
  startGame: 'Start Game',
  howToPlay: 'How to Play',
  instructions: [
    'Pick up packages from green zones',
    'Deliver them to the red zones',
    'Avoid cars, puddles and angry pedestrians',
    'Faster deliveries = more points!',
  ],
  controls: 'Controls',
  controlsDesktop: 'WASD / Arrow Keys to move · E or Space to pick up / deliver',
  controlsMobile: 'Use the on-screen joystick · Tap the action button to pick up / deliver',
  language: 'Language',

  score: 'Score',
  lives: 'Lives',
  time: 'Time',
  delivery: 'Delivery',
  deliveries: 'Deliveries',
  combo: 'Combo',

  pickupReady: 'Package ready!',
  pickupTip: 'Press E to pick up',
  deliverHere: 'Deliver here!',
  deliverTip: 'Press E to deliver',
  packageDropped: 'Package dropped!',
  nearMiss: 'Near miss!',
  watchOut: 'Watch out!',
  ouch: 'Ouch!',
  tooSlow: 'Too slow!',
  windGust: 'Wind gust!',
  splat: 'Splat!',

  delivered: 'Delivered!',
  speedBonus: 'Speed Bonus!',
  comboBonus: 'Combo Bonus!',
  perfect: 'PERFECT!',
  great: 'GREAT!',
  good: 'GOOD!',
  timeBonus: 'Time Bonus',

  paused: 'Paused',
  resume: 'Resume',
  restart: 'Restart',
  mainMenu: 'Main Menu',

  gameOver: 'Game Over',
  finalScore: 'Final Score',
  deliveriesCompleted: 'Deliveries Completed',
  bestCombo: 'Best Combo',
  tryAgain: 'Try Again',
  newGame: 'New Game',
  playAgain: 'Play Again',
  highScore: 'High Score',

  trafficJam: 'Traffic jam ahead!',
  puddle: 'Slippery puddle!',
  construction: 'Construction zone!',
  pedScatter: 'Pedestrians scattering!',

  levelUp: 'Things just got crazier!',
  cityExpert: 'City Expert!',

  pressToPickup: 'Press E to pick up',
  pressToDeliver: 'Press E to deliver',
  tapToPickup: 'Tap ⬆ to pick up',
  tapToDeliver: 'Tap ⬆ to deliver',
  getReady: 'Get Ready!',
  go: 'GO!',
  timeSurvived: 'Time Survived',
  bestStage: 'Best Stage',
  shop: 'Shop',
  back: 'Back',
  equipped: 'Equipped',
  equip: 'Equip',
  confirm: 'Confirm',
  shopHint: 'Earn trophies 🏅 by playing — spend them on skins!',
  trophiesEarned: 'Trophies Earned',
  totalEarned: 'Total Earned',
  bestTime: 'Best Time',
  gamesPlayed: 'Games Played',
  newRecord: '🎉 New Record!',
};

const pt: Translations = {
  title: 'Entrega do Caos',
  tagline: 'A cidade está contando com você. (Ela não deveria.)',
  startGame: 'Iniciar Jogo',
  howToPlay: 'Como Jogar',
  instructions: [
    'Pegue os pacotes nas zonas verdes',
    'Entregue nas zonas vermelhas',
    'Evite carros, poças e pedestres furiosos',
    'Entregas rápidas = mais pontos!',
  ],
  controls: 'Controles',
  controlsDesktop: 'WASD / Setas para mover · E ou Espaço para pegar / entregar',
  controlsMobile: 'Use o joystick na tela · Toque no botão de ação para pegar / entregar',
  language: 'Idioma',

  score: 'Pontos',
  lives: 'Vidas',
  time: 'Tempo',
  delivery: 'Entrega',
  deliveries: 'Entregas',
  combo: 'Combo',

  pickupReady: 'Pacote pronto!',
  pickupTip: 'Pressione E para pegar',
  deliverHere: 'Entregue aqui!',
  deliverTip: 'Pressione E para entregar',
  packageDropped: 'Pacote caiu!',
  nearMiss: 'Passou raspando!',
  watchOut: 'Cuidado!',
  ouch: 'Ai!',
  tooSlow: 'Muito devagar!',
  windGust: 'Rajada de vento!',
  splat: 'Estralo!',

  delivered: 'Entregue!',
  speedBonus: 'Bônus de Velocidade!',
  comboBonus: 'Bônus de Combo!',
  perfect: 'PERFEITO!',
  great: 'ÓTIMO!',
  good: 'BOM!',
  timeBonus: 'Bônus de Tempo',

  paused: 'Pausado',
  resume: 'Continuar',
  restart: 'Reiniciar',
  mainMenu: 'Menu Principal',

  gameOver: 'Fim de Jogo',
  finalScore: 'Pontuação Final',
  deliveriesCompleted: 'Entregas Realizadas',
  bestCombo: 'Melhor Combo',
  tryAgain: 'Tentar Novamente',
  newGame: 'Novo Jogo',
  playAgain: 'Jogar Novamente',
  highScore: 'Recorde',

  trafficJam: 'Engarrafamento à frente!',
  puddle: 'Poça escorregadia!',
  construction: 'Zona de obras!',
  pedScatter: 'Pedestres em fuga!',

  levelUp: 'Ficou muito mais caótico!',
  cityExpert: 'Expert da Cidade!',

  pressToPickup: 'Pressione E para pegar',
  pressToDeliver: 'Pressione E para entregar',
  tapToPickup: 'Toque ⬆ para pegar',
  tapToDeliver: 'Toque ⬆ para entregar',
  getReady: 'Prepare-se!',
  go: 'VAI!',
  timeSurvived: 'Tempo Sobrevivido',
  bestStage: 'Melhor Fase',
  shop: 'Loja',
  back: 'Voltar',
  equipped: 'Equipado',
  equip: 'Equipar',
  confirm: 'Confirmar',
  shopHint: 'Ganhe troféus 🏅 jogando — gaste-os em skins!',
  trophiesEarned: 'Troféus Ganhos',
  totalEarned: 'Total Ganho',
  bestTime: 'Melhor Tempo',
  gamesPlayed: 'Partidas Jogadas',
  newRecord: '🎉 Novo Recorde!',
};

export const TRANSLATIONS: Record<Language, Translations> = { en, pt };
