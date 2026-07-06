sed -i '/<span className="text-\[10px\] font-bold uppercase tracking-wider">Recibos<\/span>/!b;n;a\
        </button>\
        <button \
          onClick={() => setActiveTab("stats")}\
          className={cn(\
            "p-3 rounded-2xl transition-all relative flex flex-col items-center gap-1",\
            activeTab === "stats" ? "text-accent bg-accent-soft" : "text-white/30"\
          )}\
        >\
          <PieChartIcon size={22} />\
          <span className="text-[10px] font-bold uppercase tracking-wider">Gráficos</span>\
' src/App.tsx
