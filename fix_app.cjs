const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const correctCode = `      const currentMonthTotal = totalPending + totalPaid;
      
      const previousMonthTotal = (previousMonthDebts || [])
        .reduce((acc, d) => acc + (Number(d?.amount) || 0), 0);

      return {
        totalPending,
        totalPaid,
        debtCount: (displayedDebtsForMonth || []).filter(d => d && d.status === "pending").length,
        displayedDebtsForMonth: displayedDebtsForMonth || [],
        currentMonthTotal,
        previousMonthTotal
      };
    } catch (error) {
      console.error("Error calculating stats:", error);
      return {
        totalPending: 0,
        totalPaid: 0,
        debtCount: 0,
        displayedDebtsForMonth: [],
        currentMonthTotal: 0,
        previousMonthTotal: 0
      };
    }
  }, [debts, monthOffset]);

  const addDebt = (data: Omit<Debt, 'id' | 'createdAt'>) => {
    try {
      const newDebt: Debt = {
`;

// we want to replace from `      const currentMonthTotal = totalPending + totalPaid;`
// up to and including `  }, [debts, monthOffset]);`
// and then the messed up lines.

const startIndex = content.indexOf('      const currentMonthTotal = totalPending + totalPaid;');
const endIndex = content.indexOf('        ...data,');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + correctCode + content.substring(endIndex);
  fs.writeFileSync('src/App.tsx', content);
  console.log("Fixed!");
} else {
  console.log("Could not find boundaries.");
}
