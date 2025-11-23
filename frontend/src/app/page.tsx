"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, Activity, Lock, Globe, ChevronRight } from "lucide-react";

export default function LandingPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 50 } }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white overflow-hidden selection:bg-purple-500/30">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 z-0">
        <motion.div
          className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"
          animate={{
            backgroundPosition: ['0px 0px', '64px 64px'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[40%] h-[40%] rounded-full bg-indigo-900/5 blur-[100px]" />
      </div>

      {/* Floating Orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-purple-500/30"
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/3 right-1/3 w-3 h-3 rounded-full bg-cyan-500/30"
          animate={{
            y: [0, 40, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/3 w-2 h-2 rounded-full bg-fuchsia-500/30"
          animate={{
            y: [0, -25, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl">
            <img
              src="/logo.png"
              alt="Liquidation Engine"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-xl font-bold tracking-tight">Liquidation<span className="text-purple-400">Engine</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#stats" className="hover:text-white transition-colors">Network</a>
          <a href="#security" className="hover:text-white transition-colors">Security</a>
          <a href="#docs" className="hover:text-white transition-colors">Docs</a>
        </div>
        <Link href="/dashboard">
          <button className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 hover:border-purple-500/50 text-white font-medium transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            Enter App
          </button>
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-32">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="text-center max-w-5xl mx-auto space-y-8"
        >
          <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium mb-6 backdrop-blur-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-400"></span>
            </span>
            <span className="font-semibold">v2.0 Live on Solana Mainnet</span>
          </motion.div>

          <motion.h1 variants={item} className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
            Institutional Grade <br />
            <span className="relative inline-block mt-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400">
                Liquidation Engine
              </span>
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 blur-2xl -z-10"
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </span>
          </motion.h1>

          <motion.p variants={item} className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            Protect your protocol with the fastest, most reliable liquidation infrastructure on Solana.
            <span className="text-white font-medium"> Sub-50ms execution</span>, MEV protection, and real-time risk monitoring.
          </motion.p>

          <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <a href="#features">
              <button className="px-10 py-5 rounded-2xl bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-sm border border-purple-500/30 hover:border-purple-500/50 text-white font-semibold hover:bg-gradient-to-r hover:from-purple-600/30 hover:to-indigo-600/30 transition-all flex items-center gap-2 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                View Documentation <ChevronRight className="h-4 w-4" />
              </button>
            </a>
          </motion.div>

          {/* Floating Trust Badges */}
          <motion.div
            variants={item}
            className="flex flex-wrap items-center justify-center gap-8 pt-12 text-sm text-zinc-500"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>Audited by CertiK</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span>99.99% Uptime</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-purple-400" />
              <span>$450M+ Secured</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-24 border-t border-white/10 pt-12"
        >
          {[
            { label: "Total Secured", value: "$450M+", color: "text-white" },
            { label: "Execution Speed", value: "< 50ms", color: "text-emerald-400" },
            { label: "Uptime", value: "99.99%", color: "text-cyan-400" },
            { label: "Liquidations", value: "142K+", color: "text-purple-400" },
          ].map((stat, i) => (
            <div key={i} className="text-center md:text-left">
              <p className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
              <p className="text-sm text-zinc-500 uppercase tracking-wider font-medium">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24">
          {[
            {
              title: "Real-time Monitoring",
              desc: "WebSocket streams provide instant updates on position health and market risks.",
              icon: Activity,
              gradient: "from-purple-500/20 to-blue-500/20"
            },
            {
              title: "Flash Execution",
              desc: "Priority fee optimization ensures your liquidations land in the very next block.",
              icon: Zap,
              gradient: "from-yellow-500/20 to-orange-500/20"
            },
            {
              title: "Bank-Grade Security",
              desc: "Audited smart contracts with multi-sig insurance funds and emergency pauses.",
              icon: Lock,
              gradient: "from-emerald-500/20 to-cyan-500/20"
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="group relative p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
