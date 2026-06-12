const LOGO_SRC =
  'https://raw.githubusercontent.com/hayimpapa/week00-main-page/main/public/w52.png'

const TABS = [
  { id: 'rebalancer', label: 'Portfolio Rebalancer' },
  { id: 'about', label: 'About This Build' },
]

export default function TopNav({ activeTab, onTabChange }) {
  return (
    <nav className="z-30 flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-1.5 shadow-sm sm:gap-4 sm:px-6 no-print">
      <a
        href="https://52-app.com/"
        target="_blank"
        rel="noopener noreferrer"
        title="52 Apps in 52 Weeks"
        className="shrink-0 opacity-90 transition hover:opacity-100"
      >
        <img
          src={LOGO_SRC}
          alt="52 Apps Logo"
          className="h-[34px] w-auto rounded-md p-0.5"
        />
      </a>

      <div className="flex items-center gap-1 overflow-x-auto sm:gap-2">
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={`whitespace-nowrap rounded-t-md border-b-2 px-2.5 py-2 text-sm font-medium transition sm:px-4 ${
                active
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-transparent text-ink-500 hover:bg-slate-100 hover:text-ink-900'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
