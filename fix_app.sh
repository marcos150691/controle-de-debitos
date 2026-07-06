sed -i '323,357c\
      const currentMonthTotal = totalPending + totalPaid;\
      \
      const previousMonthTotal = (previousMonthDebts || [])\
        .reduce((acc, d) => acc + (Number(d?.amount) || 0), 0);\
\
      return {\
        totalPending,\
        totalPaid,\
        debtCount: (displayedDebtsForMonth || []).filter(d => d && d.status === "pending").length,\
        displayedDebtsForMonth: displayedDebtsForMonth || [],\
        currentMonthTotal,\
        previousMonthTotal\
      };\
    } catch (error) {\
      console.error("Error calculating stats:", error);\
      return {\
        totalPending: 0,\
        totalPaid: 0,\
        debtCount: 0,\
        displayedDebtsForMonth: [],\
        currentMonthTotal: 0,\
        previousMonthTotal: 0\
      };\
    }\
  }, [debts, monthOffset]);\
' src/App.tsx
