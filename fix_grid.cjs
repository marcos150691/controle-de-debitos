const fs = require('fs');
let content = fs.readFileSync('src/components/TransactionList.tsx', 'utf-8');

content = content.replace(
  `                              <h4 
                                title={d.description}
                                className={cn(
                                "font-bold text-sm leading-tight mb-2 line-clamp-2",
                                d.status === 'paid' && "line-through opacity-50"
                              )}>
                                {d.description}
                              </h4>`,
  `                              <div className="flex flex-col gap-1 mb-2">
                                <h4 
                                  className={cn(
                                  "font-bold text-sm leading-tight",
                                  !expandedDebts.has(d.id) && "line-clamp-2",
                                  d.status === 'paid' && "line-through opacity-50"
                                )}>
                                  {d.description}
                                </h4>
                                {d.description.length > 25 && (
                                  <button
                                    onClick={(e) => toggleExpanded(e, d.id)}
                                    className="text-[10px] text-accent/60 hover:text-accent font-bold uppercase tracking-widest text-left w-max transition-colors"
                                  >
                                    {expandedDebts.has(d.id) ? 'Recolher' : 'Detalhes'}
                                  </button>
                                )}
                              </div>`
);

content = content.replace(
  `                                  <h4 
                                    title={d.description}
                                    className={cn(
                                    "font-bold text-sm sm:text-base leading-tight mb-0.5 line-clamp-2",
                                    d.status === 'paid' ? "line-through opacity-50" : "text-accent",
                                    isVirtual && "opacity-60 italic"
                                  )}>{d.description}</h4>`,
  `                                  <div className="flex flex-col gap-0.5 mb-1">
                                    <h4 
                                      className={cn(
                                      "font-bold text-sm sm:text-base leading-tight",
                                      !expandedDebts.has(d.id) && "line-clamp-2",
                                      d.status === 'paid' ? "line-through opacity-50" : "text-accent",
                                      isVirtual && "opacity-60 italic"
                                    )}>{d.description}</h4>
                                    {d.description.length > 30 && (
                                      <button
                                        onClick={(e) => toggleExpanded(e, d.id)}
                                        className="text-[10px] text-white/40 hover:text-white font-bold uppercase tracking-widest text-left w-max transition-colors"
                                      >
                                        {expandedDebts.has(d.id) ? 'Recolher' : 'Detalhes'}
                                      </button>
                                    )}
                                  </div>`
);

fs.writeFileSync('src/components/TransactionList.tsx', content);
