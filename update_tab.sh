sed -i 's|        ) : activeTab === '"'receipts'"' ? (|        ) : activeTab === '"'stats'"' ? (\
          <div className="max-w-4xl mx-auto mt-6">\
            <CategoryChart \
              debts={stats.displayedDebtsForMonth} \
              categories={categories} \
              currentMonthTotal={stats.currentMonthTotal}\
              previousMonthTotal={stats.previousMonthTotal}\
            />\
          </div>\
        ) : activeTab === '"'receipts'"' ? (|g' src/App.tsx
