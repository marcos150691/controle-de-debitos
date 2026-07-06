sed -i 's/px-6 py-4 z-40 flex items-center justify-around rounded-t-\[32px\]/px-6 py-4 z-40 flex items-center gap-6 overflow-x-auto hide-scrollbar rounded-t-\[32px\]/g' src/App.tsx
sed -i 's/className={cn(/className={cn(\n            "min-w-max",/g' src/App.tsx
