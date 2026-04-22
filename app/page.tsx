import DemoBanner from "@/components/DemoBanner";
import SiteHeader from "@/components/SiteHeader";
import Sidebar from "@/components/Sidebar";
import ArticleContent from "@/components/ArticleContent";

export default function Home() {
  return (
    <>
      <DemoBanner />
      <SiteHeader />
      <div className="page-layout">
        <Sidebar />
        <ArticleContent />
      </div>
    </>
  );
}
