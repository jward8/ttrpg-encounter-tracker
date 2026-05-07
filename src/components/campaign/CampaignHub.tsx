import { useCampaignStore } from '../../store/campaignStore';
import PartyRoster from './PartyRoster';
import ActiveEncounterCard from './ActiveEncounterCard';

export default function CampaignHub() {
  const campaign = useCampaignStore(s => s.campaign);
  if (!campaign) return null;
  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full space-y-6">
      <div>
        <div className="text-xs text-stone-500 uppercase tracking-widest">Campaign</div>
        <h2 className="text-xl font-semibold text-stone-100">{campaign.name}</h2>
      </div>

      <PartyRoster />
      <ActiveEncounterCard />
    </div>
  );
}
