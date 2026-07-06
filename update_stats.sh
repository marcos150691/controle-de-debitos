sed -i '246,324c\
  const stats: DebtStats = useMemo(() => {\
    try {\
      const getDebtsForMonth = (offset: number) => {\
        const selectedDate = startOfMonth(addMonths(new Date(), offset));\
        \
        const currentMonthReal = debts.filter(d => {\
          if (!d || !d.dueDate) return false;\
          const dDate = new Date(d.dueDate);\
          return !isNaN(dDate.getTime()) && isSameMonth(dDate, selectedDate);\
        });\
\
        const recurringDebts = debts.filter(d => d && (d.isFixed || d.isInstallment));\
        const projected: Debt[] = [...currentMonthReal];\
\
        recurringDebts.forEach(debt => {\
          if (!debt.dueDate) return;\
          const dDate = new Date(debt.dueDate);\
          if (isNaN(dDate.getTime())) return;\
          \
          const startDate = startOfMonth(dDate);\
          \
          if (selectedDate > startDate) {\
            const alreadyExists = currentMonthReal.find(d => \
               d.description === debt.description && \
               d.category === debt.category &&\
              (d.isFixed || d.isInstallment)\
            );\
\
            if (alreadyExists) return;\
\
            const monthsDiff = (selectedDate.getFullYear() - startDate.getFullYear()) * 12 + (selectedDate.getMonth() - startDate.getMonth());\
            \
            if (isNaN(monthsDiff) || monthsDiff < 0) return;\
\
            if (debt.isFixed) {\
              const newDate = addMonths(dDate, monthsDiff);\
              if (!isNaN(newDate.getTime())) {\
                projected.push({\
                  ...debt,\
                  id: `${debt.id}-proj-${offset}`,\
                  dueDate: newDate.toISOString(),\
                  status: "pending",\
                } as Debt);\
              }\
            } else if (debt.isInstallment && debt.totalInstallments && debt.currentInstallment) {\
              const projectedInstallment = debt.currentInstallment + monthsDiff;\
              if (projectedInstallment <= debt.totalInstallments) {\
                const newDate = addMonths(dDate, monthsDiff);\
                if (!isNaN(newDate.getTime())) {\
                  projected.push({\
                    ...debt,\
                    id: `${debt.id}-proj-${offset}`,\
                    dueDate: newDate.toISOString(),\
                    currentInstallment: projectedInstallment,\
                    status: "pending",\
                  } as Debt);\
                }\
              }\
            }\
          }\
        });\
\
        return projected;\
      };\
\
      const displayedDebtsForMonth = getDebtsForMonth(monthOffset);\
      const previousMonthDebts = getDebtsForMonth(monthOffset - 1);\
\
      const totalPending = (displayedDebtsForMonth || [])\
        .filter((d) => d && d.status === "pending")\
        .reduce((acc, d) => acc + (Number(d?.amount) || 0), 0);\
\
      const totalPaid = (displayedDebtsForMonth || [])\
        .filter((d) => d && d.status === "paid")\
        .reduce((acc, d) => acc + (Number(d?.amount) || 0), 0);\
\
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
' src/App.tsx
