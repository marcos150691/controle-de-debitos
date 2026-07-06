const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const navStart = content.indexOf('{/* Mobile Bottom Navigation Bar */}');
const navEnd = content.indexOf('      {/* Decorative Elements */}');

let navSection = content.substring(navStart, navEnd);

// Remove the PlusIcon button from navSection
const buttonStart = navSection.indexOf('<button \n          onClick={() => {\n            setActiveTab(\'debts\');');
const buttonEnd = navSection.indexOf('</button>', buttonStart) + 9;

const plusButton = navSection.substring(buttonStart, buttonEnd);
navSection = navSection.substring(0, buttonStart) + navSection.substring(buttonEnd);

// Add flex-shrink-0 to the buttons in navSection
navSection = navSection.replace(/className=\{cn\(\n            "p-3/g, 'className={cn(\n            "p-3 flex-shrink-0 min-w-[70px]",');

content = content.substring(0, navStart) + navSection + 
`      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-24 right-6 lg:hidden z-40">
` + plusButton.replace('p-4 -mt-12', 'p-4') + `
      </div>
` + content.substring(navEnd);

fs.writeFileSync('src/App.tsx', content);
