import React from "react";
import { ArrowLeft, BookOpen, Users, Megaphone, Trophy, Calculator, Brain, Scale, CheckCircle } from "lucide-react";
import { useGame } from '../context/GameContext';

export default function HelpCoinche4j() {
  const { navigateTo,goBack } = useGame();

  return (
<div className="min-h-screen pt-safe pb-safe flex items-center justify-center p-4"

     style={{

       backgroundColor: '#042204', // vert très foncé

       backgroundImage: `
          radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px),
          radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)
        `,

       backgroundPosition: '0 0, 10px 10px',

       backgroundSize: '20px 20px'

     }}

>     <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl relative left-1/2 transform -translate-x-1/2" style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}>

        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={goBack}
            className="p-2 text-green-700 hover:text-green-900 hover:bg-green-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="flex-1 text-center text-3xl font-bold text-green-800 tracking-tight">
            Coinche – 4 Joueurs
          </h1>
          <div className="w-8" />
        </div>

        {/* Contenu */}
        <section className="space-y-8 text-gray-700 leading-relaxed">

          {/* Introduction */}
          <div>
            <p>
              La <strong>Coinche</strong> est une variante stratégique de la belote qui se joue à 4 joueurs, en deux équipes de deux. 
              L’objectif : <span className="font-semibold">réussir le contrat annoncé</span> en remportant les plis nécessaires.
            </p>
          </div>

          {/* Mise en place */}
          <div>
            <h2 className="flex items-center text-xl font-semibold text-green-700 mb-2">
              <Users className="w-5 h-5 mr-2" /> Mise en place
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Deux équipes de deux (partenaires en diagonale).</li>
              <li>Distribution : 8 cartes par joueur (par paquets de 3-2-3, 3-3-2 ou 2-3-3).</li>
              <li>Le joueur à gauche du donneur commence les enchères.</li>
            </ul>
          </div>

          {/* Annonces */}
          <div>
            <h2 className="flex items-center text-xl font-semibold text-green-700 mb-2">
              <Megaphone className="w-5 h-5 mr-2" /> Les annonces
            </h2>
            <p>
              Les joueurs annoncent un <strong>contrat</strong> (minimum 80 points) et une couleur d’atout, ou passent.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Contrats : 80 à 180, <strong>Capot</strong> et <strong>Générale</strong>.</li>
              <li><strong>Capot</strong> ➝ l’équipe doit gagner <em>tous les plis</em>.</li>
              <li><strong>Générale</strong> ➝ un joueur unique remporte <em>tous les plis</em>.</li>
              <li>Atouts possibles : Pique, Cœur, Carreau, Trèfle, mais aussi <strong>Tout Atout</strong> ou <strong>Sans Atout</strong>.</li>
              <li>Annonce spéciale : <strong>Coinche</strong> (contrat doublé), <strong>Surcoinche</strong> (contrat triplé).</li>
            </ul>
          </div>

          {/* Valeur des cartes */}
          <div>
            <h2 className="flex items-center text-xl font-semibold text-green-700 mb-2">
              <Scale className="w-5 h-5 mr-2" /> Valeur des cartes
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800">Atout</h3>
                <ul className="list-disc pl-6 text-sm">
                  <li>Valet : 20</li>
                  <li>9 : 14</li>
                  <li>As : 11</li>
                  <li>10 : 10</li>
                  <li>Roi : 4</li>
                  <li>Dame : 3</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Non-atout</h3>
                <ul className="list-disc pl-6 text-sm">
                  <li>As : 11</li>
                  <li>10 : 10</li>
                  <li>Roi : 4</li>
                  <li>Dame : 3</li>
                  <li>Valet : 2</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Tout Atout</h3>
                <ul className="list-disc pl-6 text-sm">
                  <li>Valet : 14</li>
                  <li>9 : 9</li>
                  <li>As : 6</li>
                  <li>10 : 5</li>
                  <li>Roi : 3</li>
                  <li>Dame : 1</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Sans Atout</h3>
                <ul className="list-disc pl-6 text-sm">
                  <li>As : 19</li>
                  <li>10 : 10</li>
                  <li>Roi : 4</li>
                  <li>Dame : 3</li>
                  <li>Valet : 2</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Règles */}
          <div>
            <h2 className="flex items-center text-xl font-semibold text-green-700 mb-2">
              <BookOpen className="w-5 h-5 mr-2" /> Règles essentielles
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>On doit <strong>fournir la couleur demandée</strong> si possible.</li>
              <li>Si c’est de l’atout : obligation de jouer un atout plus fort si possible.</li>
              <li>Si ce n’est pas de l’atout : on joue la couleur demandé ou atout si on n'a pas la couleur demandé.</li>
              <li>Si on n’a ni couleur demandée ni atout : on joue ce qu’on veut.</li>
              <li>Si le partenaire est maître : pas d’obligation de mettre un atout.</li>
            </ul>
          </div>

          {/* Stratégie */}
          <div>
            <h2 className="flex items-center text-xl font-semibold text-green-700 mb-2">
              <Brain className="w-5 h-5 mr-2" /> Stratégie
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Gérer ses atouts avec précaution.</li>
              <li>Compter les cartes et mémoriser les atouts sortis.</li>
              <li>Jouer en équipe : protéger son partenaire.</li>
              <li>Prendre la main pour imposer sa stratégie au bon moment.</li>
            </ul>
          </div>

          {/* Points */}
          <div>
            <h2 className="flex items-center text-xl font-semibold text-green-700 mb-2">
              <Calculator className="w-5 h-5 mr-2" /> Calcul des points
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>162 points à distribuer (hors belote/rebelote).</li>
              <li>Si le contrat est réussi ➝ équipe preneuse marque ses points + contrat.</li>
              <li>Échec ➝ adversaires marquent tout (162 + contrat).</li>
              <li>Coinche ➝ doublé. Surcoinche ➝ triplé.</li>
              <li>Belote-Rebelote (Roi+Dame d’atout) ➝ 20 points.</li>
            </ul>
          </div>

          {/* Objectif */}
          <div>
            <h2 className="flex items-center text-xl font-semibold text-green-700 mb-2">
              <Trophy className="w-5 h-5 mr-2" /> Objectif
            </h2>
            <p>La partie se joue généralement en <strong>2000 points</strong>. La première équipe qui atteint ce score remporte la partie.</p>
          </div>

          <div className="mt-10">
            <h2 className="flex items-center text-xl font-bold text-green-800 mb-4">
              <CheckCircle className="w-6 h-6 mr-2" /> Fiche récapitulative
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 bg-green-50 border border-green-200 rounded-xl p-6 text-sm text-gray-800 shadow-inner">
              <div className="space-y-2">
                <p>✔️ Fournir la couleur demandée</p>
                <p>✔️ À l’atout ➝ monter si possible</p>
                <p>✔️ Pas d’obligation si partenaire maître</p>
              </div>
              <div className="space-y-2">
                <p>✔️ Belote-Rebelote : +20 pts</p>
                <p>✔️ Capot = tous les plis</p>
                <p>✔️ Générale = tous les plis par 1 joueur</p>
                
              </div>
            </div>
          </div>


        </section>
      </div>
    </div>
  );
}
