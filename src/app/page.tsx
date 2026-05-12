import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Schedule from "@/components/Schedule";
import PersonalBests from "@/components/PersonalBests";
import AchievementBadges from "@/components/AchievementBadges";
import Management from "@/components/Management";
import Cameo from "@/components/Cameo";
import TeamSova from "@/components/TeamSova";
import PhotoStrip from "@/components/PhotoStrip";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="bg-black">
      <Header />
      <Hero />
      <Schedule />
      <PersonalBests />
      <AchievementBadges />
      <Management />
      <Cameo />
      <TeamSova />
      <PhotoStrip />
      <Footer />
    </main>
  );
}
