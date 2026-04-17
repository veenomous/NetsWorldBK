import UploadForm from "@/components/UploadForm";

export const metadata = {
  title: "Add Content — BK Grit",
  description: "Upload a Twitter Space, podcast episode, or RSS feed.",
};

export default function UploadPage() {
  return <UploadForm defaultType="space" />;
}
