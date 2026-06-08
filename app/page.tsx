import { cookies } from "next/headers";
import { LandingPage } from "@/components/landing-page";

const languageCookie = "hofadmin-language";
const supportedLanguages = ["en", "sv"] as const;
type Language = (typeof supportedLanguages)[number];

export default async function Home() {
  const cookieStore = await cookies();
  const cookieLanguage = cookieStore.get(languageCookie)?.value;
  const initialLanguage: Language = supportedLanguages.includes(cookieLanguage as Language) ? (cookieLanguage as Language) : "en";

  return <LandingPage initialLanguage={initialLanguage} />;
}
