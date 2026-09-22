import React, { useState, useRef } from 'react';
import { 
  Crosshair, Shield, Users, Trophy, DollarSign, 
  ArrowRight, CheckCircle2, Play, Volume2, 
  FileText, Sparkles, Award, Zap, ChevronRight, 
  Settings, Flame, Clock, Target, Flag, ShieldAlert,
  Crown, Smartphone, Layers, Check, Copy, ExternalLink,
  Menu, X, Radio, Eye
} from 'lucide-react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'motion/react';
import { Player, FinancialConfig, ScenarioPreset, MatchHistoryRecord } from '../types';
import { tacticalAudio } from '../utils/audio';

interface LandingPageProps {
  onOpenApp: () => void;
  onOpenAdmin: () => void;
  players: Player[];
  config: FinancialConfig;
  scenarios: ScenarioPreset[];
  matchHistory: MatchHistoryRecord[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenApp,
  onOpenAdmin,
  players,
  config,
  scenarios,
  matchHistory,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('deathmatch');
  const [selectedRole, setSelectedRole] = useState<'Sniper' | 'Assault' | 'Tank' | 'Flanker'>('Sniper');
  const [demoCopiedPix, setDemoCopiedPix] = useState(false);

  // Parallax ref and scroll progress for Hero Section
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 25,
    restDelta: 0.001,
  });

  // Parallax transforms for Hero layers
  const bgGridY = useTransform(smoothProgress, [0, 1], ['0%', '35%']);
  const bgGlowY = useTransform(smoothProgress, [0, 1], ['0%', '65%']);
  const heroTextY = useTransform(smoothProgress, [0, 1], ['0%', '15%']);
  const hudParallaxY = useTransform(smoothProgress, [0, 1], ['0%', '-14%']);
  const badge1ParallaxY = useTransform(smoothProgress, [0, 1], ['0%', '-45%']);
  const badge2ParallaxY = useTransform(smoothProgress, [0, 1], ['0%', '-25%']);
  const badge3ParallaxY = useTransform(smoothProgress, [0, 1], ['0%', '-60%']);
  const crosshairRotate = useTransform(smoothProgress, [0, 1], [0, 100]);
  const crosshairScale = useTransform(smoothProgress, [0, 1], [1, 1.35]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.9], [1, 0.25]);

  // Interactive 3D Mouse Tilt for Hero HUD Card
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 22 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 22 });

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleHeroMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const confirmedCount = players.filter((p) => p.status === 'confirmed').length;
  const totalMatchesCount = matchHistory.length;
  const activeScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  // Tactical Professions / Classes detailed data
  const tacticalRolesData = [
    {
      id: 'Sniper' as const,
      name: 'Atirador',
      alias: 'Sniper & Reconhecimento de Precisão',
      tag: 'TIRO DE LONGA DISTÂNCIA',
      accentColor: 'emerald',
      bgGlow: 'from-emerald-500/10 to-transparent',
      borderColor: 'border-emerald-500/40 hover:border-emerald-500',
      activeCardClass: 'border-emerald-500 bg-emerald-950/30 text-emerald-400 shadow-lg shadow-emerald-950/50',
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      icon: Target,
      tagline: 'Um disparo, uma eliminação. O olho vigilante que protege todo o esquadrão.',
      mission: 'Eliminar ameaças estratégicas de média e longa distância, proteger rotas críticas de avanço e manter vigilância visual permanente com chamadas táticas (callouts de posição) para o pelotão.',
      howItActs: 'Atua recuado nos bunkers mais altos, cantos protegidos e fundos de arena. Evita correr a esmo: o Atirador é paciente e calculista. Aguarda o momento exato em que o adversário coloca a cabeça para fora para disparar um tiro limpo e certeiro, sem desperdício de munição.',
      equipment: 'Marcadores com cano longo ou estriado (Apex/Flatline para curva de alcance e trajetória plana), miras red-dot ou luneta de ampliação, lente térmica antiembaçante de amplo ângulo de visão e colete silencioso.',
      strengths: ['Alcance superior de engajamento', 'Economia cirúrgica de bolinhas', 'Visão panorâmica e inteligência de campo'],
      weaknesses: ['Vulnerável em combates corpo a corpo / curta distância', 'Mobilidade mais estática'],
      eloBalance: 'O balanceador ELO do PaintOps garante que ambos os times tenham atiradores equivalentes, impedindo que um lado fique "cego" ou sem cobertura de fundo.',
      stats: {
        range: '95%',
        fireRate: '35%',
        mobility: '50%',
        ammoUsage: 'Baixo (150 a 300 bolinhas/jogo)'
      }
    },
    {
      id: 'Assault' as const,
      name: 'Assalto',
      alias: 'Ponta de Lança & Invasão Frontal',
      tag: 'CONQUISTA TERRITORIAL',
      accentColor: 'orange',
      bgGlow: 'from-orange-500/10 to-transparent',
      borderColor: 'border-orange-500/40 hover:border-orange-500',
      activeCardClass: 'border-orange-500 bg-orange-950/30 text-orange-400 shadow-lg shadow-orange-950/50',
      badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      icon: Flame,
      tagline: 'Pressão ininterrupta, avanço agressivo e conquista de objetivos na linha de frente.',
      mission: 'Liderar a ofensiva principal, disputar os bunkers centrais (linha dos 50m), empurrar a linha de defesa inimiga para trás e capturar objetivos primários (bandeiras, pontos de controle ou escolta de VIP).',
      howItActs: 'É o coração combativo de qualquer time. Desloca-se em duplas com cobertura rápida, executa "snap shooting" (espiar pela barricada, disparar e voltar em fração de segundo) e quebra defesas através de agressividade controlada.',
      equipment: 'Marcadores semiautomáticos ou eletrônicos leves, equilibrados e compactos, joelheiras reforçadas para deslizamentos, colete de impacto ergonômico e 2 a 4 pods de recarga rápida.',
      strengths: ['Versatilidade em qualquer situação de combate', 'Conquista e sustentação de território central', 'Tempo de resposta ultra-rápido'],
      weaknesses: ['Maior índice de eliminações sofridas por estar na linha de frente', 'Exposição frequente a múltiplos ângulos de tiro'],
      eloBalance: 'Equaliza a força de combate direto para que nenhum time seja empurrado para dentro da própria base logo nos primeiros minutos.',
      stats: {
        range: '70%',
        fireRate: '80%',
        mobility: '85%',
        ammoUsage: 'Médio a Alto (400 a 700 bolinhas/jogo)'
      }
    },
    {
      id: 'Tank' as const,
      name: 'Tanque / Sup',
      alias: 'Fogo Pesado & Supressão de Área',
      tag: 'SUPRESSÃO MACIÇA',
      accentColor: 'blue',
      bgGlow: 'from-blue-500/10 to-transparent',
      borderColor: 'border-blue-500/40 hover:border-blue-500',
      activeCardClass: 'border-blue-500 bg-blue-950/30 text-blue-400 shadow-lg shadow-blue-950/50',
      badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      icon: Shield,
      tagline: 'O escudo do pelotão: tranca os inimigos sob chuva contínua de tinta para seu time avançar.',
      mission: 'Fornecer saturação ininterrupta e cobertura pesada. Sua função é "travar" os bunkers inimigos sob fogo constante, impedindo que os adversários coloquem o cano para fora para alvejar seus companheiros.',
      howItActs: 'Funciona como a âncora tática da equipe. Posiciona-se em bunkers de ângulo aberto e despeja centenas de bolinhas na barricada adversária. Cria um efeito de choque psicológico onde ninguém do outro lado ousa se mover, dando tempo livre para os Flanqueadores avançarem.',
      equipment: 'Marcador eletrônico com cadência extrema (Ramping / 10.5+ BPS), loader motorizado pressurizado (capacidade 200+ bolinhas), cinto/arnês tático com 4 a 8 pods extras e cilindro de ar comprimido (HPA) de alta litragem.',
      strengths: ['Domínio espacial absoluto da arena', 'Trava o time inimigo nas barricadas', 'Cria janelas protegidas para avanços da equipe'],
      weaknesses: ['Altíssimo consumo de munição (mais caixas de bolinhas)', 'Mobilidade e velocidade reduzidas pelo peso dos pods'],
      eloBalance: 'Papel fundamental no PaintOps: um time com suporte de fogo pesado contra outro sem suporte gera disparidade opressiva.',
      stats: {
        range: '75%',
        fireRate: '98%',
        mobility: '45%',
        ammoUsage: 'Altíssimo (800 a 1.500+ bolinhas/jogo)'
      }
    },
    {
      id: 'Flanker' as const,
      name: 'Flanqueador',
      alias: 'Batedor Veloz & Infiltração Lateral',
      tag: 'VELOCIDADE & EMBOSCADA',
      accentColor: 'amber',
      bgGlow: 'from-amber-500/10 to-transparent',
      borderColor: 'border-amber-500/40 hover:border-amber-500',
      activeCardClass: 'border-amber-500 bg-amber-950/30 text-amber-400 shadow-lg shadow-amber-950/50',
      badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      icon: Zap,
      tagline: 'Invisível na corrida, letal pelas costas. Quebra trincheiras estáticas pelos pontos cegos.',
      mission: 'Percorrer as alas externas e extremidades do campo ("snake" e linhas de borda) em alta velocidade e furtividade para surpreender defensores pelas costas ou pelos pontos cegos laterais.',
      howItActs: 'Aproveita o estrondo da trocação central e o fogo do Tanque como camuflagem sonora. Corre agachado, rasteja e desliza pelas laterais da arena. Surge em ângulos improváveis para eliminar jogadores entrincheirados que só olham para a frente.',
      equipment: 'Equipamento ultraleve e discreto, marcador compacto sem peso supérfluo, calçado com travas táticas para arrancadas em grama ou terra batida e roupas ajustadas para evitar arrasto.',
      strengths: ['Fator surpresa devastador', 'Velocidade e mobilidade incomparáveis', 'Desmantela defesas conservadoras'],
      weaknesses: ['Risco crítico se for detectado em campo aberto', 'Isolamento em relação ao restante do time'],
      eloBalance: 'O algoritmo emparelha flanqueadores para garantir que ambos os lados tenham patrulhamento e ameaça nas duas alas.',
      stats: {
        range: '60%',
        fireRate: '75%',
        mobility: '98%',
        ammoUsage: 'Moderado (300 a 500 bolinhas/jogo)'
      }
    }
  ];

  const currentRoleData = tacticalRolesData.find((r) => r.id === selectedRole) || tacticalRolesData[0];

  const handleCopyPixDemo = () => {
    if (config.pixKey) {
      navigator.clipboard.writeText(config.pixKey);
      setDemoCopiedPix(true);
      tacticalAudio.playBeep();
      setTimeout(() => setDemoCopiedPix(false), 2000);
    }
  };

  const handleTestSiren = () => {
    tacticalAudio.playSiren();
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
      {/* 1. TOP TACTICAL NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-[#0A0D14]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Tactical Identity */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25 font-tactical font-black text-xl">
              <Crosshair className="w-5 h-5 animate-pulse" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black font-tactical tracking-wider text-white uppercase">
                  PAINT<span className="text-orange-500">OPS</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  SISTEMA TÁTICO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-code tracking-tight">
                COMANDO & OPERAÇÕES DE PAINTBALL
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-tactical uppercase tracking-wider text-slate-300">
            <a href="#recursos" className="hover:text-orange-400 transition-colors">
              Recursos Táticos
            </a>
            <a href="#profissoes" className="hover:text-orange-400 transition-colors">
              Profissões & Classes
            </a>
            <a href="#modos" className="hover:text-orange-400 transition-colors">
              Modos de Jogo
            </a>
            <a href="#financeiro" className="hover:text-orange-400 transition-colors">
              Rateio & PIX
            </a>
            <a href="#ranking" className="hover:text-orange-400 transition-colors">
              Hall da Fama
            </a>
            <a href="#faq" className="hover:text-orange-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action CTAs: Operational App & Admin Panel */}
          <div className="hidden sm:flex items-center gap-2.5">
            <button
              onClick={() => {
                tacticalAudio.playClick();
                onOpenAdmin();
              }}
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-tactical text-xs uppercase font-bold tracking-wider border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-orange-400" />
              <span>Painel Admin</span>
            </button>

            <button
              onClick={() => {
                tacticalAudio.playVictory();
                onOpenApp();
              }}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-tactical text-xs uppercase font-black tracking-wider shadow-md shadow-orange-600/30 border border-orange-500/60 transition-all flex items-center gap-2 active:scale-95"
            >
              <span>Abrir App Tático</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => {
                tacticalAudio.playClick();
                onOpenApp();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-orange-600 text-white font-tactical text-[11px] font-bold uppercase tracking-wider"
            >
              Abrir App
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-[#0A0D14] border-b border-slate-800 px-4 py-4 space-y-3">
            <div className="flex flex-col gap-2 font-tactical uppercase text-xs tracking-wider text-slate-300">
              <a 
                href="#recursos" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-orange-400"
              >
                Recursos Táticos
              </a>
              <a 
                href="#profissoes" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-orange-400"
              >
                Profissões & Classes
              </a>
              <a 
                href="#modos" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-orange-400"
              >
                Modos de Combate
              </a>
              <a 
                href="#financeiro" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-orange-400"
              >
                Rateio & PIX
              </a>
              <a 
                href="#ranking" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-orange-400"
              >
                Hall da Fama
              </a>
              <a 
                href="#faq" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-orange-400"
              >
                FAQ
              </a>
            </div>

            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenApp();
                }}
                className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-tactical text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2"
              >
                <span>Acessar Centro de Operações</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="w-full py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 font-tactical text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2"
              >
                <Settings className="w-3.5 h-3.5 text-orange-400" />
                <span>Painel Administrador (CRUD)</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION WITH PARALLAX & TACTICAL DEPTH */}
      <section 
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative overflow-hidden pt-12 pb-24 sm:pt-20 sm:pb-32"
      >
        {/* Parallax Tactical Background Grid */}
        <motion.div 
          style={{ y: bgGridY }}
          className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:28px_28px] opacity-35 pointer-events-none"
        />

        {/* Tactical Crosshair Watermark in Background with Parallax Rotate & Scale */}
        <motion.div 
          style={{ rotate: crosshairRotate, scale: crosshairScale }}
          className="absolute -top-20 -right-20 w-[420px] h-[420px] sm:w-[580px] sm:h-[580px] pointer-events-none opacity-[0.035] text-orange-500 flex items-center justify-center select-none"
        >
          <Crosshair className="w-full h-full stroke-[0.8]" />
        </motion.div>

        {/* Ambient Glowing Orbs with Smooth Parallax Depth */}
        <motion.div 
          style={{ y: bgGlowY }}
          className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none"
        />
        <motion.div 
          style={{ y: bgGridY }}
          className="absolute bottom-6 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Thesis & CTAs with Parallax Scroll Offset */}
            <motion.div 
              style={{ y: heroTextY, opacity: heroOpacity }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              {/* Tactical Status Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-tactical uppercase tracking-widest shadow-sm shadow-orange-500/10">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                <span>SISTEMA TÁTICO OPERACIONAL • PAINTBALL & AIRSOFT</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-tactical tracking-tight uppercase leading-[1.08] text-white">
                DOMINE CADA <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500">COMBATE</span>.
                <br />
                DA ESCALAÇÃO AO <span className="text-emerald-400">RATEIO NO PIX</span>.
              </h1>

              {/* Refined Subtitle */}
              <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Chega de discussões na montagem de times e confusão no acerto das contas. O 
                <strong className="text-white font-semibold"> PaintOps</strong> entrega balanceamento algorítmico 
                Alfa & Bravo, cronômetro oficial de juiz com áudio militar, prestação de contas automatizada e ranking gamificado.
              </p>

              {/* CTA Action Cluster */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  onClick={() => {
                    tacticalAudio.playVictory();
                    onOpenApp();
                  }}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-tactical font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-600/35 border border-orange-500/60 transition-all flex items-center justify-center gap-2.5 active:scale-95 group"
                >
                  <Crosshair className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                  <span>Entrar no Centro Operacional</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    tacticalAudio.playClick();
                    onOpenAdmin();
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-tactical font-bold text-sm uppercase tracking-wider border border-slate-700 transition-all flex items-center justify-center gap-2 hover:border-slate-600"
                >
                  <Settings className="w-4 h-4 text-orange-400" />
                  <span>Painel Administrador (CRUD)</span>
                </button>
              </div>

              {/* Social Proof / Tactical Metrics Snapshot */}
              <div className="pt-4 grid grid-cols-3 gap-2 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0 text-left">
                <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
                  <p className="text-[10px] font-tactical uppercase tracking-wider text-slate-400">Operadores</p>
                  <p className="text-xl font-bold font-code text-white mt-0.5">{players.length} Atletas</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
                  <p className="text-[10px] font-tactical uppercase tracking-wider text-slate-400">Prontos</p>
                  <p className="text-xl font-bold font-code text-emerald-400 mt-0.5">{confirmedCount} em Campo</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
                  <p className="text-[10px] font-tactical uppercase tracking-wider text-slate-400">Rateio Base</p>
                  <p className="text-xl font-bold font-code text-orange-400 mt-0.5">Automático</p>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Live Interactive Tactical HUD Card with 3D Tilt & Parallax Floating Badges */}
            <div className="lg:col-span-5 relative [perspective:1000px]">
              
              {/* Floating Tactical Badge 1: Top-Left (Headshot/Elimination) */}
              <motion.div
                style={{ y: badge1ParallaxY }}
                animate={{ y: [0, -7, 0] }}
                transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }}
                className="absolute -top-7 -left-5 z-20 hidden sm:flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#080C14]/95 border border-orange-500/50 shadow-xl shadow-orange-500/20 backdrop-blur-md"
              >
                <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                  <Target className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <p className="text-[9px] font-tactical font-black text-orange-400 uppercase tracking-widest leading-tight">
                    ELIMINAÇÃO CONFIRMADA
                  </p>
                  <p className="text-[11px] font-code text-slate-200 font-bold leading-tight">
                    +150 PTS • TIME ALFA
                  </p>
                </div>
              </motion.div>

              {/* Floating Tactical Badge 2: Bottom-Right (PIX Paid) */}
              <motion.div
                style={{ y: badge2ParallaxY }}
                animate={{ y: [0, 7, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-6 -right-4 z-20 hidden sm:flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#080C14]/95 border border-emerald-500/50 shadow-xl shadow-emerald-500/20 backdrop-blur-md"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] font-tactical font-black text-emerald-400 uppercase tracking-widest leading-tight">
                    RATEIO PIX CONFIRMADO
                  </p>
                  <p className="text-[11px] font-code text-emerald-300 font-bold leading-tight">
                    R$ 35,00 • COMPROVANTE OK
                  </p>
                </div>
              </motion.div>

              {/* Floating Tactical Badge 3: Mid-Left (MVP) */}
              <motion.div
                style={{ y: badge3ParallaxY }}
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 4.6, ease: "easeInOut", delay: 2 }}
                className="absolute top-1/2 -left-8 -translate-y-1/2 z-20 hidden xl:flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#080C14]/95 border border-amber-500/50 shadow-xl shadow-amber-500/20 backdrop-blur-md"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Crown className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <p className="text-[9px] font-tactical font-black text-amber-400 uppercase tracking-widest leading-tight">
                    MVP DA ARENA
                  </p>
                  <p className="text-[11px] font-code text-slate-200 font-bold leading-tight">
                    SGT. CAVEIRA (8 KILLS)
                  </p>
                </div>
              </motion.div>

              {/* Main Interactive HUD Card with 3D Tilt & Parallax Offset */}
              <motion.div 
                style={{ 
                  y: hudParallaxY,
                  rotateX: rotateX,
                  rotateY: rotateY,
                  transformStyle: 'preserve-3d',
                }}
                className="relative mx-auto max-w-md bg-[#0D1117] rounded-2xl border-2 border-orange-500/40 p-4 sm:p-5 shadow-2xl shadow-orange-500/10 transition-shadow hover:shadow-orange-500/20"
              >
                {/* HUD Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="font-tactical font-black text-xs uppercase tracking-wider text-white">
                      HUD DE COMBATE AO VIVO
                    </span>
                  </div>
                  <span className="font-code text-[11px] text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/30">
                    CENÁRIO: MATA-MATA
                  </span>
                </div>

                {/* Score Clash Mockup */}
                <div className="grid grid-cols-2 gap-3 my-4">
                  {/* Alfa */}
                  <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 text-center">
                    <span className="text-[11px] font-tactical font-black uppercase text-blue-400 tracking-wider">
                      TIME ALFA
                    </span>
                    <p className="text-3xl font-code font-black text-blue-200 mt-1">
                      04
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium">5 operadores ativos</span>
                  </div>

                  {/* Bravo */}
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-center">
                    <span className="text-[11px] font-tactical font-black uppercase text-red-400 tracking-wider">
                      TIME BRAVO
                    </span>
                    <p className="text-3xl font-code font-black text-red-200 mt-1">
                      02
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium">4 operadores ativos</span>
                  </div>
                </div>

                {/* Match Clock Simulator */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="text-[10px] font-tactical uppercase tracking-wider text-slate-400">Tempo Restante</p>
                      <p className="text-lg font-code font-black text-amber-300">03:42</p>
                    </div>
                  </div>
                  <button
                    onClick={handleTestSiren}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-tactical font-bold uppercase tracking-wider border border-slate-700 flex items-center gap-1.5 transition-colors"
                    title="Testar sirene tática no navegador"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-orange-400" />
                    <span>Sirene Áudio</span>
                  </button>
                </div>

                {/* Instant Action in HUD */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-tactical">PRESTAÇÃO NO PIX:</span>
                  <span className="font-code font-bold text-emerald-400">R$ {config.venueCost > 0 ? (config.venueCost / (confirmedCount || 1)).toFixed(2) : '35.00'} / atleta</span>
                </div>

                {/* Clickable Overlay to open App */}
                <button
                  onClick={onOpenApp}
                  className="mt-3 w-full py-2.5 rounded-lg bg-orange-600/90 hover:bg-orange-500 text-white font-tactical font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Abrir Tela Completa do Juiz</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. CORE TACTICAL PILLARS (RECURSOS) */}
      <section id="recursos" className="py-16 sm:py-24 bg-[#0A0D14] border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-tactical font-bold uppercase tracking-widest text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/30">
              RECURSOS COMPLETOS
            </span>
            <h2 className="text-2xl sm:text-4xl font-black font-tactical uppercase tracking-tight text-white">
              TUDO O QUE SEU GRUPO PRECISA PARA O COMBATE PERFEITO
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Desenvolvido por quem joga e organiza partidas aos finais de semana. Da lista de presença no WhatsApp ao encerramento com troféus.
            </p>
          </div>

          {/* 6 Tactical Modules Grid with Scroll Reveal Animations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 1. Pelotão & Operadores */}
            <motion.div 
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="bg-[#0e131d] border border-slate-800 rounded-2xl p-6 hover:border-orange-500/50 transition-all group hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/5"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-tactical font-bold text-lg uppercase text-white mb-2">
                1. Pelotão & Operadores
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Cadastro com codinome tático, nome civil, função de combate (Assalto, Sniper, Tanque, Flanqueador), controle de presença (Campo, Espera, Ausente) e nível de mira de 1 a 5 estrelas.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Diferencia quem tem equipamento próprio</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Histórico de jogos, vitórias e eliminações</span>
                </li>
              </ul>
            </motion.div>

            {/* 2. Sorteador com Algoritmo ELO */}
            <motion.div 
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="bg-[#0e131d] border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all group hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-tactical font-bold text-lg uppercase text-white mb-2">
                2. Sorteio de Times ELO
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Algoritmo inteligente de equilíbrio que equaliza as estrelas de mira e balanceia as funções táticas para que nenhuma equipe fique desproporcional.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Modo Equilibrado com 1 clique</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Modo Caótico & Capitães de Equipe</span>
                </li>
              </ul>
            </motion.div>

            {/* 3. Juiz & Cronômetro com Áudio */}
            <motion.div 
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="bg-[#0e131d] border border-slate-800 rounded-2xl p-6 hover:border-red-500/50 transition-all group hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/5"
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-tactical font-bold text-lg uppercase text-white mb-2">
                3. Juiz de Campo & Áudio Tático
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Cronômetro militar de alta visibilidade, botões grandes pensados para luvas táticas, sirene de combate e voz sintetizada aos 60s, 30s e contagem final.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>Eliminações e faltas por equipe</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>Eleição de MVP do combate</span>
                </li>
              </ul>
            </motion.div>

            {/* 4. Rateio Financeiro & PIX */}
            <motion.div 
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="bg-[#0e131d] border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-all group hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="font-tactical font-bold text-lg uppercase text-white mb-2">
                4. Rateio & Exportação PDF
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Divisão automática dos custos do campo e caixas de bolinhas entre os presentes. Tabela individual de pendências, cópia para WhatsApp e download de PDF oficial.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Geração de PDF técnico com jspdf</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Chave PIX com cópia em 1 toque</span>
                </li>
              </ul>
            </motion.div>

            {/* 5. Hall da Fama & Medalhas */}
            <motion.div 
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: 0.25 }}
              className="bg-[#0e131d] border border-slate-800 rounded-2xl p-6 hover:border-amber-500/50 transition-all group hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="font-tactical font-bold text-lg uppercase text-white mb-2">
                5. Hall da Fama & Estatísticas
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Ranking competitivo da temporada por Vitórias, Winrate e MVPs, além de medalhas bem-humoradas como "Bucha de Canhão" e "Gatilho Nervoso".
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Pódio militar com troféus</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Medalhas dinâmicas por desempenho</span>
                </li>
              </ul>
            </motion.div>

            {/* 6. Painel Administrador CRUD */}
            <motion.div 
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: 0.3 }}
              className="bg-[#0e131d] border-2 border-orange-500/40 rounded-2xl p-6 hover:border-orange-500 transition-all group hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 mb-4 group-hover:scale-110 transition-transform">
                <Settings className="w-6 h-6" />
              </div>
              <h3 className="font-tactical font-bold text-lg uppercase text-white mb-2 flex items-center gap-2">
                <span>6. Painel Admin Completo</span>
                <span className="text-[10px] bg-orange-500 text-slate-950 font-black px-1.5 py-0.5 rounded">NOVO</span>
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Painel administrativo com CRUDs dedicados para operadores, tarifas financeiras, histórico de partidas, cenários de jogo e importação/exportação de backups JSON.
              </p>
              <button
                onClick={onOpenAdmin}
                className="w-full py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-tactical text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Acessar Painel CRUD</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 3.5. PROFISSÕES & CLASSES TÁTICAS (ATIRADOR, ASSALTO, TANQUE / SUP, FLANQUEADOR) */}
      <section id="profissoes" className="py-16 sm:py-24 bg-[#0A0E17] border-y border-slate-800/80 relative overflow-hidden">
        {/* Ambient tactical lighting */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-tactical font-black uppercase tracking-widest">
              <Target className="w-3.5 h-3.5" />
              <span>CLASSES & ESPECIALIZAÇÕES TÁTICAS</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black font-tactical uppercase tracking-tight text-white">
              AS 4 PROFISSÕES DE COMBATE NO PAINTOPS
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              No paintball, uma equipe desorganizada perde em minutos. Cada operador possui uma vocação única: descubra o que cada profissão faz, seu equipamento ideal e como nosso algoritmo ELO distribui as funções com precisão cirúrgica entre os times Alfa e Bravo.
            </p>
          </div>

          {/* Interactive Role Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {tacticalRolesData.map((role) => {
              const isSelected = selectedRole === role.id;
              const RoleIcon = role.icon;
              const roleCount = players.filter((p) => p.role === role.id).length;

              return (
                <button
                  key={role.id}
                  onClick={() => {
                    setSelectedRole(role.id);
                    tacticalAudio.playClick();
                  }}
                  className={`text-left p-5 rounded-2xl border transition-all relative overflow-hidden group ${
                    isSelected
                      ? role.activeCardClass
                      : 'bg-[#0E131E] border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      isSelected
                        ? 'bg-slate-900/80 border-current'
                        : 'bg-slate-900 border-slate-700 text-slate-400 group-hover:text-slate-200'
                    }`}>
                      <RoleIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-code px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                      {roleCount} no Pelotão
                    </span>
                  </div>

                  <span className={`text-[10px] font-tactical font-black tracking-wider uppercase px-2 py-0.5 rounded border inline-block mb-1.5 ${role.badgeClass}`}>
                    {role.tag}
                  </span>

                  <h3 className="text-xl font-tactical font-black uppercase text-white tracking-wide">
                    {role.name}
                  </h3>

                  <p className="text-xs text-slate-400 font-medium line-clamp-2 mt-1">
                    {role.alias}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-tactical uppercase">
                    <span className={isSelected ? 'font-bold' : 'text-slate-500'}>
                      {isSelected ? '✓ Inspecionando Dossiê' : 'Clique para Explorar'}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-1' : 'group-hover:translate-x-1'}`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Deep Intel Dossier Panel for Selected Role */}
          <div className="bg-[#0E131E] border-2 border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl ${currentRoleData.bgGlow} blur-2xl pointer-events-none`} />

            {/* Dossier Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-white shrink-0 shadow-inner">
                  {React.createElement(currentRoleData.icon, { className: 'w-7 h-7 text-orange-400' })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-code text-slate-400 uppercase tracking-widest">DOSSIÊ TÁTICO:</span>
                    <span className={`text-xs font-tactical font-black px-2 py-0.5 rounded border uppercase ${currentRoleData.badgeClass}`}>
                      {currentRoleData.tag}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-tactical font-black uppercase text-white">
                    {currentRoleData.name} • <span className="text-slate-400 text-lg sm:text-xl font-bold">{currentRoleData.alias}</span>
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    tacticalAudio.playWhistle();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-tactical uppercase tracking-wider border border-slate-700 flex items-center gap-1.5"
                >
                  <Volume2 className="w-3.5 h-3.5 text-orange-400" />
                  <span>Sinal Sonoro</span>
                </button>
                <div className="px-3 py-1.5 rounded-lg bg-orange-600/10 border border-orange-500/30 text-orange-400 text-xs font-tactical uppercase tracking-wider font-bold">
                  {players.filter((p) => p.role === currentRoleData.id).length} Atletas Registrados
                </div>
              </div>
            </div>

            {/* Tagline quote */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-6">
              <p className="text-sm sm:text-base font-tactical text-orange-400 italic">
                "{currentRoleData.tagline}"
              </p>
            </div>

            {/* 4 Pillars Grid for the Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* 1. O que faz / Para que serve */}
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-2">
                <div className="flex items-center gap-2 text-xs font-tactical font-bold uppercase tracking-wider text-orange-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>O que faz / Para que serve (Missão Primária)</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {currentRoleData.mission}
                </p>
              </div>

              {/* 2. Como atua no Campo */}
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-2">
                <div className="flex items-center gap-2 text-xs font-tactical font-bold uppercase tracking-wider text-blue-400">
                  <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Como atua no Campo de Paintball</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {currentRoleData.howItActs}
                </p>
              </div>

              {/* 3. Equipamento & Estilo */}
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-2">
                <div className="flex items-center gap-2 text-xs font-tactical font-bold uppercase tracking-wider text-amber-400">
                  <Target className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Equipamento Ideal & Estilo de Marcador</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {currentRoleData.equipment}
                </p>
              </div>

              {/* 4. Balanceamento no Algoritmo ELO */}
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-2">
                <div className="flex items-center gap-2 text-xs font-tactical font-bold uppercase tracking-wider text-purple-400">
                  <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Papel no Balanceador ELO PaintOps</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {currentRoleData.eloBalance}
                </p>
              </div>
            </div>

            {/* Strengths & Weaknesses Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                <p className="text-xs font-tactical font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pontos Fortes (Vantagens Táticas)</span>
                </p>
                <ul className="text-xs text-slate-300 space-y-1">
                  {currentRoleData.strengths.map((s, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30">
                <p className="text-xs font-tactical font-bold uppercase tracking-wider text-red-400 mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Ponto de Atenção (Vulnerabilidade Tática)</span>
                </p>
                <ul className="text-xs text-slate-300 space-y-1">
                  {currentRoleData.weaknesses.map((w, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Comparison Matrix Table for All 4 Roles */}
          <div className="mt-12 bg-[#0E131E] border border-slate-800 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <span className="text-[10px] font-tactical font-bold uppercase tracking-widest text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  MATRIZ COMPARATIVA
                </span>
                <h3 className="text-xl font-tactical font-black uppercase text-white mt-1">
                  COMPARAÇÃO TÁTICA DAS 4 PROFISSÕES
                </h3>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Visão rápida dos atributos fundamentais para orientar a escolha da sua função e a distribuição do seu pelotão.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-tactical uppercase text-slate-400">
                    <th className="pb-3 pr-4">Profissão</th>
                    <th className="pb-3 px-3">Alcance</th>
                    <th className="pb-3 px-3">Cadência</th>
                    <th className="pb-3 px-3">Mobilidade</th>
                    <th className="pb-3 px-3">Consumo Bolinhas</th>
                    <th className="pb-3 pl-3">Posição Primária</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-code text-slate-300">
                  <tr className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 pr-4 font-tactical font-bold text-emerald-400 flex items-center gap-2">
                      <Target className="w-4 h-4 shrink-0" />
                      <span>Atirador (Sniper)</span>
                    </td>
                    <td className="py-3 px-3 text-emerald-300">Muito Alto (95%)</td>
                    <td className="py-3 px-3 text-slate-400">Baixa (Semi/Tiro a Tiro)</td>
                    <td className="py-3 px-3 text-slate-400">Moderada (50%)</td>
                    <td className="py-3 px-3 text-emerald-400 font-semibold">Econômico (150-300)</td>
                    <td className="py-3 pl-3 font-tactical text-slate-300">Bunkers Altos & Retaguarda</td>
                  </tr>

                  <tr className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 pr-4 font-tactical font-bold text-orange-400 flex items-center gap-2">
                      <Flame className="w-4 h-4 shrink-0" />
                      <span>Assalto (Assault)</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">Médio (70%)</td>
                    <td className="py-3 px-3 text-orange-300">Alta (Snap Shooting)</td>
                    <td className="py-3 px-3 text-orange-300">Alta (85%)</td>
                    <td className="py-3 px-3 text-slate-300">Médio (400-700)</td>
                    <td className="py-3 pl-3 font-tactical text-slate-300">Linha de 50m & Bunkers Centrais</td>
                  </tr>

                  <tr className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 pr-4 font-tactical font-bold text-blue-400 flex items-center gap-2">
                      <Shield className="w-4 h-4 shrink-0" />
                      <span>Tanque / Sup (Tank)</span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">Médio-Alto (75%)</td>
                    <td className="py-3 px-3 text-blue-400 font-semibold">Máxima (10.5+ BPS)</td>
                    <td className="py-3 px-3 text-slate-400">Baixa (45%)</td>
                    <td className="py-3 px-3 text-red-400 font-semibold">Altíssimo (800-1500+)</td>
                    <td className="py-3 pl-3 font-tactical text-slate-300">Âncora Central / Cobertura Pesada</td>
                  </tr>

                  <tr className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 pr-4 font-tactical font-bold text-amber-400 flex items-center gap-2">
                      <Zap className="w-4 h-4 shrink-0" />
                      <span>Flanqueador (Flanker)</span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">Curto (60%)</td>
                    <td className="py-3 px-3 text-slate-300">Média-Alta (75%)</td>
                    <td className="py-3 px-3 text-amber-400 font-semibold">Máxima (98%)</td>
                    <td className="py-3 px-3 text-slate-300">Moderado (300-500)</td>
                    <td className="py-3 pl-3 font-tactical text-slate-300">Alas Externas / Snake / Linha de Borda</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tactical Squad Synergy Callout */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-orange-600/10 via-amber-600/10 to-blue-600/10 border border-orange-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-tactical font-black uppercase text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <span>Fórmula do Esquadrão Perfeito (Exemplo 5v5 ou 6v6)</span>
                </p>
                <p className="text-xs text-slate-300">
                  <strong className="text-orange-400">1 Tanque/Sup</strong> tranca a barricada do inimigo, <strong className="text-emerald-400">1 Atirador</strong> elimina quem tentar olhar para o lado, <strong className="text-amber-400">1 Flanqueador</strong> corre pela ponta da asa e <strong className="text-orange-400">2 Assaltos</strong> invadem o centro da arena para capturar o objetivo.
                </p>
              </div>

              <button
                onClick={() => {
                  tacticalAudio.playVictory();
                  onOpenApp();
                }}
                className="shrink-0 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-tactical text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <span>Escalar Esquadrão</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE SCENARIOS SHOWCASE (MODOS DE COMBATE) */}
      <section id="modos" className="py-16 sm:py-24 bg-[#07090E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-tactical font-bold uppercase tracking-widest text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/30">
                MODOS DE COMBATE
              </span>
              <h2 className="text-2xl sm:text-4xl font-black font-tactical uppercase tracking-tight text-white mt-3">
                CENÁRIOS PRÉ-CONFIGURADOS E CUSTOMIZÁVEIS
              </h2>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md">
              Selecione o tipo de missão. O cronômetro ajusta os tempos, as regras e a sirene automaticamente.
            </p>
          </div>

          {/* Scenario Tabs Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {scenarios.map((sc) => {
              const isSelected = sc.id === activeScenario.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => {
                    setSelectedScenarioId(sc.id);
                    tacticalAudio.playClick();
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-orange-600/15 border-orange-500 text-white shadow-sm shadow-orange-500/20'
                      : 'bg-[#0E131D] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-tactical font-black uppercase tracking-wider truncate">
                    {sc.name}
                  </p>
                  <p className="text-[11px] text-slate-400 font-code mt-0.5">
                    {sc.defaultDurationMinutes} min • {sc.shortName}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Scenario Card Display */}
          <div className="bg-[#0E131D] border border-slate-800 rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2 space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-orange-400 text-xs font-code">
                  <span>⏱️ Duração recomendada: {activeScenario.defaultDurationMinutes} minutos</span>
                </div>
                <h3 className="text-2xl font-tactical font-black uppercase text-white">
                  {activeScenario.name}
                </h3>
                <p className="text-orange-400 font-tactical text-sm tracking-wide">
                  "{activeScenario.tagline}"
                </p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {activeScenario.description}
                </p>
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 mt-4">
                  <p className="text-[10px] font-tactical uppercase tracking-wider text-slate-400">Objetivo Principal:</p>
                  <p className="text-sm font-semibold text-emerald-400 mt-0.5">{activeScenario.objective}</p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800/80 text-center space-y-3">
                <p className="text-xs font-tactical uppercase tracking-wider text-slate-400">Pronto para Jogar Este Modo?</p>
                <button
                  onClick={() => {
                    tacticalAudio.playVictory();
                    onOpenApp();
                  }}
                  className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-tactical text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-orange-600/30"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Carregar no Cronômetro</span>
                </button>
                <p className="text-[11px] text-slate-500">
                  Ou edite cenários no Painel Administrador
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. RATEIO FINANCEIRO & PIX DEMO */}
      <section id="financeiro" className="py-16 sm:py-24 bg-[#0A0D14] border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <span className="text-xs font-tactical font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                PRESTAÇÃO DE CONTAS IMPECÁVEL
              </span>
              <h2 className="text-2xl sm:text-4xl font-black font-tactical uppercase tracking-tight text-white">
                CHEGA DE CALOTE OU DE FICAR NO PREJUÍZO
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                O PaintOps calcula na hora a taxa de quem alugou marcador e quem tem equipamento próprio. Em 1 clique você gera o texto pronto para colar no grupo do WhatsApp ou baixa o PDF técnico completo.
              </p>
              
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">✓</div>
                  <span>Rateio per capita justo da locação e caixas comunitárias</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">✓</div>
                  <span>Soma automática de recargas adicionais de bolinhas</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">✓</div>
                  <span>Exportação em PDF técnico com tabelas e pontuação final</span>
                </div>
              </div>

              {/* PIX Quick Box */}
              <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-tactical uppercase tracking-wider text-slate-400">Chave PIX do Organizador ({config.pixKeyType}):</p>
                  <p className="text-sm font-code font-bold text-white truncate">{config.pixKey || 'pix@paintops.com.br'}</p>
                </div>
                <button
                  onClick={handleCopyPixDemo}
                  className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-tactical text-xs uppercase font-bold tracking-wider shrink-0 flex items-center gap-1.5 transition-colors"
                >
                  {demoCopiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{demoCopiedPix ? 'Copiado!' : 'Copiar PIX'}</span>
                </button>
              </div>
            </div>

            {/* Financial Visual Mockup */}
            <div className="bg-[#0E131D] border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <span className="font-tactical font-black text-sm uppercase text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-400" />
                  <span>SIMULAÇÃO FINANCEIRA DA PARTIDA</span>
                </span>
                <span className="text-[11px] font-code text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  100% AUTOMÁTICO
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-400">Locação do Campo:</span>
                  <span className="font-code font-bold text-white">R$ {config.venueCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-400">Bolinhas Coletivas ({config.communityBoxesCount} caixas):</span>
                  <span className="font-code font-bold text-white">R$ {(config.communityBoxesCount * config.boxPrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-400">Atletas Presentes:</span>
                  <span className="font-code font-bold text-orange-400">{confirmedCount || 8} operadores</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-orange-950/30 border border-orange-500/40 text-sm font-bold">
                  <span className="text-orange-300 font-tactical uppercase">Rateio Base / Operador:</span>
                  <span className="font-code text-white">
                    R$ {((config.venueCost + config.communityBoxesCount * config.boxPrice) / (confirmedCount || 1)).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  tacticalAudio.playVictory();
                  onOpenApp();
                }}
                className="mt-4 w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-tactical text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <span>Ver Módulo Financeiro Completo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HALL DA FAMA & RANKING SNAPSHOT */}
      <section id="ranking" className="py-16 sm:py-24 bg-[#07090E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-tactical font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              GAMIFICAÇÃO DE COMBATE
            </span>
            <h2 className="text-2xl sm:text-4xl font-black font-tactical uppercase tracking-tight text-white">
              RANKING & MEDALHAS DA TEMPORADA
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Acompanhe quem é o sniper do grupo e quem levou o troféu "Bucha de Canhão" por cair no primeiro minuto.
            </p>
          </div>

          {/* Podium Top 3 Operators Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {players.slice(0, 3).map((p, idx) => {
              const medals = ['🥇 1º LUGAR', '🥈 2º LUGAR', '🥉 3º LUGAR'];
              const borderColors = ['border-amber-500', 'border-slate-400', 'border-amber-700'];
              return (
                <div
                  key={p.id}
                  className={`bg-[#0E131D] border-2 ${borderColors[idx] || 'border-slate-800'} rounded-2xl p-5 text-center relative`}
                >
                  <span className="text-[10px] font-tactical font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    {medals[idx]}
                  </span>
                  <h4 className="font-tactical font-black text-xl uppercase text-white mt-3">
                    "{p.callsign}"
                  </h4>
                  <p className="text-xs text-slate-400">{p.name}</p>

                  <div className="grid grid-cols-3 gap-1.5 my-3 pt-3 border-t border-slate-800 font-code text-xs">
                    <div>
                      <p className="text-[9px] uppercase text-slate-500">Vitórias</p>
                      <p className="font-bold text-emerald-400">{p.stats.wins}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-slate-500">MVPs</p>
                      <p className="font-bold text-amber-400">{p.stats.mvps}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-slate-500">Kills</p>
                      <p className="font-bold text-white">{p.stats.eliminations}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. FAQ ACCORDION */}
      <section id="faq" className="py-16 sm:py-24 bg-[#0A0D14] border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-tactical font-bold uppercase tracking-widest text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              DÚVIDAS FREQUENTES
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-tactical uppercase tracking-tight text-white">
              PERGUNTAS FREQUENTES SOBRE O PAINTOPS
            </h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <h4 className="font-tactical font-bold uppercase text-white mb-1">
                Qual a diferença prática entre as 4 profissões (Atirador, Assalto, Tanque / Sup, Flanqueador)?
              </h4>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Cada profissão atende a uma necessidade indispensável do combate: o <strong className="text-emerald-400">Atirador</strong> fornece visão e elimina alvos distantes com economia de tinta; o <strong className="text-orange-400">Assalto</strong> empurra a linha de frente e captura bandeiras e pontos centrais; o <strong className="text-blue-400">Tanque / Sup</strong> usa alta cadência para fixar o adversário nas barricadas; e o <strong className="text-amber-400">Flanqueador</strong> aproveita sua velocidade máxima para surpreender pelos flancos e pontos cegos. O algoritmo do PaintOps equilibra automaticamente essas especialidades entre os dois times.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <h4 className="font-tactical font-bold uppercase text-white mb-1">
                Como funciona o sorteador de times ELO?
              </h4>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                O algoritmo analisa o nível de mira (estrelas) e as funções táticas (Assalto, Sniper, Tanque, Flanqueador) de cada operador confirmado em campo, distribuindo-os para que o Time Alfa e o Time Bravo tenham o somatório de habilidades mais equilibrado possível.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <h4 className="font-tactical font-bold uppercase text-white mb-1">
                O cronômetro funciona mesmo sem internet no campo?
              </h4>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Sim! Toda a lógica de cronômetro, áudios táticos com síntese de voz e persistência de dados roda 100% offline no navegador via LocalStorage.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <h4 className="font-tactical font-bold uppercase text-white mb-1">
                Posso alterar operadores e preços pelo Painel Administrador?
              </h4>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Com certeza. O Painel Administrador conta com CRUDs completos para cadastrar, editar e excluir operadores, atualizar preços de aluguel e bolinhas, criar novos cenários e fazer backup completo em arquivo JSON.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FINAL CALL TO ACTION BANNER */}
      <section className="py-20 bg-gradient-to-b from-[#07090E] to-[#0D1117] border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-600/20 border border-orange-500/40 text-orange-400 mb-2">
            <Crosshair className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black font-tactical uppercase tracking-tight text-white">
            PRONTO PARA COMANDAR O PRÓXIMO COMBATE?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Acesse o Centro Tático e comece a escalar seu esquadrão em segundos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                tacticalAudio.playVictory();
                onOpenApp();
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-tactical font-black text-sm uppercase tracking-wider shadow-xl shadow-orange-600/40 border border-orange-500/60 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Acessar Centro de Operações</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                tacticalAudio.playClick();
                onOpenAdmin();
              }}
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-tactical font-bold text-sm uppercase tracking-wider border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4 text-orange-400" />
              <span>Painel Administrador (CRUD)</span>
            </button>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="py-8 bg-[#05070A] border-t border-slate-900 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-tactical font-black text-slate-300 uppercase tracking-wider">
              PAINT<span className="text-orange-500">OPS</span>
            </span>
            <span>• Sistema Tático & Operacional de Paintball</span>
          </div>

          <div className="flex items-center gap-4 font-tactical uppercase">
            <button onClick={onOpenApp} className="hover:text-orange-400 transition-colors">
              App Tático
            </button>
            <button onClick={onOpenAdmin} className="hover:text-orange-400 transition-colors">
              Painel Admin
            </button>
            <a href="#recursos" className="hover:text-slate-300 transition-colors">
              Recursos
            </a>
            <a href="#profissoes" className="hover:text-slate-300 transition-colors">
              Profissões
            </a>
            <a href="#modos" className="hover:text-slate-300 transition-colors">
              Modos
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
