# 📦 Delivery of Chaos

> Navegue pela cidade, colete pacotes, entregue antes do tempo acabar — e tente não morrer atropelado.

[![Play Now](https://img.shields.io/badge/▶%20JOGAR%20AGORA-online-f97316?style=for-the-badge)](https://filipeflm.github.io/chaos_delivery/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite)](https://vitejs.dev)

---

## 🎮 Link Jogável

**[https://filipeflm.github.io/chaos_delivery/](https://filipeflm.github.io/chaos_delivery/)**

> Funciona direto no navegador — desktop e mobile. Sem instalação, sem cadastro.

---

## 🕹️ Sobre o Jogo

**Delivery of Chaos** é um jogo top-down de entrega frenética onde você controla um entregador numa cidade que quer te matar.

Você coleta pacotes, navega por ruas com tráfego caótico, e entrega no destino antes que o cronômetro zere. A cada 15–30 segundos, o jogo fica mais difícil: mais carros, mais rápidos, menos tempo por entrega.

O objetivo é **sobreviver o máximo possível** enquanto acumula pontos e combos.

### Mecânicas principais

| Mecânica | Descrição |
|----------|-----------|
| 📦 **Coleta** | Chegue na zona verde e pressione `E` para pegar o pacote |
| 🎯 **Entrega** | Leve até a zona vermelha antes do timer zerar |
| ⚡ **Combo** | Entregas consecutivas multiplicam os pontos |
| ❤️ **Vidas** | Você tem 3 vidas — carros e pedestres tiram uma cada |
| ⏱️ **Sobrevivência** | Quanto mais tempo, mais difícil e mais pontos por segundo |

---

## 📸 Screenshots

> _Adicione screenshots na pasta `/docs/screenshots/` e referencie aqui._
>
> Sugestão: tire prints dos estágios Fácil, CAOS e INSANIDADE, e da tela da Loja.

```
Exemplo:
![Gameplay](docs/screenshots/gameplay.png)
![Shop](docs/screenshots/shop.png)
```

---

## 🎮 Controles

### Desktop

| Tecla | Ação |
|-------|------|
| `↑` `↓` `←` `→` ou `W` `A` `S` `D` | Mover o personagem |
| `E` | Pegar / Entregar pacote |
| `Esc` | Pausar / Retomar |

### Mobile

| Controle | Ação |
|----------|------|
| **Joystick** (canto inferior esquerdo) | Mover o personagem |
| **Botão E** (canto inferior direito) | Pegar / Entregar pacote |
| **⏸** no HUD | Pausar |
| **🔊** no HUD | Mutar / desmutar áudio |

> O jogo é otimizado para **modo paisagem (horizontal)** no mobile.

---

## 📈 Estágios de Dificuldade

O jogo evolui automaticamente com o tempo. Cada avanço de estágio dispara um banner dramático na tela.

| # | Nome | Quando | O que muda |
|---|------|--------|------------|
| 1 | 😌 Fácil | 0s+ | Ritmo tranquilo, tempo generoso |
| 2 | 🟡 Esquentando | 15s+ | Mais carros, mais rápidos |
| 3 | 🔥 CAOS | 35s+ | Tráfego denso, ventos e eventos |
| 4 | 💥 PANDÊMÔNIO | 65s+ | Carros em alta velocidade, pouco tempo por entrega |
| 5 | ☠️ INSANIDADE | 100s+ | Máxima loucura. Boa sorte. |

A barra de progresso no HUD mostra sua posição exata entre os 5 estágios, colorida por etapa.

---

## 🛒 Skins & Loja

Ganhe troféus 🏅 jogando e gaste-os em skins na loja. Cada skin tem uma personalidade absurda.

| Skin | Custo | Lore |
|------|-------|------|
| 📦 O Estagiário | Grátis | Primeiro dia. Zero noção. |
| 🍕 Pizza Boy | 80 🏅 | Endereço errado. De novo. |
| 🤖 Robô 3000 | 200 🏅 | Programado pra atrasar. |
| 👻 Fantasma Postal | 400 🏅 | Nem o INSS sabe que existe. |
| 🦆 Pato Correio | 800 🏅 | "Quack" quer dizer "assine aqui". |
| 🤡 Palhaço Expresso | 1500 🏅 | Tudo. Em chamas. Sempre. |

**Como ganhar troféus:**
- Score alto + tempo de sobrevivência = mais troféus por partida
- Chegar nos estágios avançados dá bônus significativo
- Sem limite máximo — runs épicas são recompensadas

---

## 🔊 Áudio

Todo o áudio é **sintetizado proceduralmente em tempo real** via Web Audio API.

- Efeitos sonoros: passos, pegada, entrega, combo, acidente, buzina, chaos event
- Trilha sonora adaptativa que aumenta de intensidade conforme o estágio avança
- Zero assets externos — tudo gerado por código

---

## 🏗️ Stack Técnica

| Tecnologia | Uso |
|------------|-----|
| **React 19** | UI, HUD, menus, loja |
| **TypeScript 5.9** | Todo o codebase |
| **Canvas 2D** | Renderização manual do jogo a 60fps |
| **Web Audio API** | Síntese procedural de áudio |
| **Vite 8** | Build tool |
| **CSS puro** | Sem frameworks de UI |

**Arquitetura:**
- `src/game/engine.ts` — loop de física e lógica
- `src/game/renderer.ts` — Canvas 2D (cidade, carros, personagem, efeitos)
- `src/game/audio.ts` — `AudioManager` + `MusicPlayer` (look-ahead clock scheduler)
- `src/components/` — React para HUD, loja, menus

---

## 🚀 Rodar Localmente

```bash
# Clone o repositório
git clone https://github.com/filipeflm/chaos_delivery.git
cd chaos_delivery

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173) no navegador.

```bash
# Build de produção
npm run build

# Preview do build
npm run preview
```

---

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── screens/     # Menu, GameOver, Pause, Shop
│   └── ui/          # HUD, TouchControls, SkinPreviewCanvas
├── game/
│   ├── engine.ts    # Game loop, física, colisões
│   ├── renderer.ts  # Canvas 2D drawing
│   ├── audio.ts     # Síntese procedural de áudio
│   ├── skins.ts     # Definições de skins + troféus
│   ├── types.ts     # Interfaces TypeScript
│   └── constants.ts # Constantes do jogo
├── hooks/
│   ├── useGameEngine.ts  # Loop RAF + integração React
│   └── useInput.ts       # Teclado
└── i18n/                 # Traduções PT/EN
```

---

## 📄 Licença

MIT — faça o que quiser, só não entregue na porta errada. 📦

---

_Feito com ☕, pânico e Web Audio API._
