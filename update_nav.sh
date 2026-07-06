sed -i '/<Camera size={24} \/>/!b;n;a\
          </button>\
          <button \
            onClick={() => setActiveTab("stats")}\
            className={cn(\
              "p-3 rounded-2xl transition-all",\
              activeTab === "stats" ? "text-accent bg-accent-soft" : "text-white/30 hover:text-white"\
            )}\
            title="Estatísticas"\
          >\
            <PieChartIcon size={24} />\
' src/App.tsx
