
interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: {
    id: string;
    label: string;
  }[];
}

export default function TabNavigation({ activeTab, onTabChange, tabs }: TabNavigationProps) {
  return (
    <div className="lycans-tab-navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`lycans-tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}