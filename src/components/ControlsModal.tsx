interface ControlsModalProps {
  onClose: () => void;
}

export function ControlsModal({ onClose }: ControlsModalProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label="Controls Guide"
    >
      <div className="w-full max-w-2xl bg-[#14131c] border-4 border-sky-400 p-6 shadow-[8px_8px_0_#09090b]">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-pixel text-lg text-sky-300">CONTROLS GUIDE</h2>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-[#252436] hover:bg-[#34324a] border-2 border-stone-400 font-pixel text-xs text-stone-100 cursor-pointer whitespace-nowrap shrink-0"
          >
            CLOSE
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Player 1 Ziyad */}
          <div className="bg-[#1c1b29] border-2 border-emerald-400/70 p-4">
            <h3 className="font-pixel text-sm text-emerald-300 mb-3">
              P1: ZIYAD (SPEED &amp; AGILITY)
            </h3>
            <dl className="space-y-2 text-sm font-arcade text-stone-200">
              <div className="flex justify-between gap-2">
                <dt className="text-stone-400">Move (Street / Lane)</dt>
                <dd className="font-pixel text-xs text-white">W A S D</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-stone-400">1P Optional Move</dt>
                <dd className="font-pixel text-xs text-white">ARROW KEYS</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-stone-400">Jump</dt>
                <dd className="font-pixel text-xs text-white">SPACE</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-stone-400">Hand Attack (3-Hit)</dt>
                <dd className="font-pixel text-xs text-amber-300">E</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-stone-400">Leg Attack (Kick/Sweep)</dt>
                <dd className="font-pixel text-xs text-amber-300">R</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-stone-400">Spinning Kick Special</dt>
                <dd className="font-pixel text-xs text-emerald-300">E + R</dd>
              </div>
            </dl>
          </div>

          {/* Player 2 Mohamed */}
          <div className="bg-[#1c1b29] border-2 border-sky-400/70 p-4">
            <h3 className="font-pixel text-sm text-sky-300 mb-3">
              P2: MOHAMED (POWERHOUSE)
            </h3>
            <dl className="space-y-2 text-sm font-arcade text-stone-200">
              <div className="flex justify-between gap-2">
                <dt className="text-stone-400">Move (Street / Lane)</dt>
                <dd className="font-pixel text-xs text-white">ARROW KEYS</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-stone-400">Jump</dt>
                <dd className="font-pixel text-xs text-white">R-SHIFT / ENTER</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-stone-400">Heavy Punch Combo</dt>
                <dd className="font-pixel text-xs text-amber-300">O</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-stone-400">Heavy Kick / Stomp</dt>
                <dd className="font-pixel text-xs text-amber-300">P</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-stone-400">Shoulder Charge Special</dt>
                <dd className="font-pixel text-xs text-sky-300">O + P</dd>
              </div>
            </dl>
          </div>
        </div>

        <p className="mt-4 font-arcade text-xs text-stone-300">
          Combat Tips: Break wooden crates &amp; trash cans for snacks. Time kicks to deflect thrown pebbles &amp; soda cans back at bullies! Press <span className="font-pixel text-white">ESC</span> to pause or <span className="font-pixel text-white">M</span> to mute.
        </p>
      </div>
    </div>
  );
}
