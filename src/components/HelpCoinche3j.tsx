import React from "react";
import { ArrowLeft, BookOpen} from "lucide-react";
import {  useGame } from '../context/useGame';

export default function HelpCoinche3j() {
  const { navigateTo, goBack } = useGame();

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

>    
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-3xl relative left-1/2 transform -translate-x-1/2" style={{ top: 'calc(1.5rem + env(safe-area-inset-top))' }}>

        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={goBack}
            className="p-2 text-green-700 hover:text-green-900 hover:bg-green-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="flex-1 text-center text-2xl font-bold text-green-800">
            Coinche - 3 Joueurs
          </h1>
          <div className="w-8" /> {/* placeholder pour équilibrer le header */}
        </div>

        {/* Contenu */}
        <section className="space-y-4">
          <p>
            La <strong>Coinche à 3 joueurs</strong> est une variante dynamique et stratégique : chacun joue pour soi, avec un système de points unique.
          </p>

          <h2 className="text-xl font-semibold text-green-600 mt-4">🎯 Mise en place</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>On retire toutes les cartes <strong>7 et 8</strong>.</li>
            <li>Chaque joueur reçoit <strong>8 cartes</strong> (24 cartes au total).</li>
            <li>Distribution obligatoire par paquets de <strong>3-2-3</strong>, <strong>2-3-3</strong> ou <strong>3-3-2</strong>.</li>
          </ul>

          <h2 className="text-xl font-semibold text-green-600 mt-4">📢 Les annonces</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Les joueurs annoncent un <strong>contrat</strong> (minimum 80 points) et une couleur d’atout.</li>
            <li>On peut aussi annoncer <strong>Tout Atout</strong> ou <strong>Sans Atout</strong>.</li>
            <li>Un seul joueur devient <strong>preneur</strong> et joue contre les deux autres.</li>
          </ul>

          <h2 className="text-xl font-semibold text-green-600 mt-4">🃏 Valeur des cartes</h2>

          <h3 className="font-semibold mt-2">➡️ Atout classique</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Valet : 20</li>
            <li>9 : 14</li>
            <li>As : 11</li>
            <li>10 : 10</li>
            <li>Roi : 4</li>
            <li>Dame : 3</li>
          </ul>

          <h3 className="font-semibold mt-2">➡️ Couleur non-atout</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>As : 11</li>
            <li>10 : 10</li>
            <li>Roi : 4</li>
            <li>Dame : 3</li>
            <li>Valet : 2</li>
          </ul>

          <h3 className="font-semibold mt-2">➡️ Tout Atout</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Valet : 14</li>
            <li>9 : 9</li>
            <li>As : 6</li>
            <li>10 : 5</li>
            <li>Roi : 3</li>
            <li>Dame : 1</li>
          </ul>
          <p className="italic">⚠️ Belote-Rebelote rapporte seulement <strong>5 points</strong> en Tout Atout.</p>

          <h3 className="font-semibold mt-2">➡️ Sans Atout</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>As : 19</li>
            <li>10 : 10</li>
            <li>Roi : 4</li>
            <li>Dame : 3</li>
            <li>Valet : 2</li>
          </ul>
          <p className="italic">⚠️ En Sans Atout, il n’y a <strong>pas de Belote-Rebelote</strong>.</p>

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

          <h2 className="text-xl font-semibold text-green-600 mt-4">📊 Calcul des points</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Le preneur doit atteindre son contrat avec ses <strong>points de plis + Belote/Rebelote</strong>.</li>
            <li>Si le preneur réussit ➝ il marque ses points, les deux autres marquent leurs propres plis.</li>
            <li>Si le preneur échoue et qu’aucun adversaire n’a coinché ➝ <strong>-80 points pour lui</strong> et <strong>+80 pour chacun des deux autres</strong>.</li>
            <li>Si un adversaire a coinché ➝ <strong>Ce joueur va marquer plus de points en cas de victoire.</strong>.</li>
            <li>Surcoinche ➝ les points sont triplés.</li>
          </ul>

          <h2 className="text-xl font-semibold text-green-600 mt-4">🏆 Objectif</h2>
          <p>
            Chaque joueur joue <strong>pour soi</strong>.  
            La partie se joue généralement en <strong>1000 points</strong>.  
            Le premier à atteindre ce score l’emporte 🎉.
          </p>
        </section>
      </div>
    </div>
  );
}
