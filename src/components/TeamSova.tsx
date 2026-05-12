import Button from "./Button";

export default function TeamSova() {
  return (
    <section
      id="videos"
      className="relative text-white px-6 py-[140px] md:px-12 bg-cover bg-center"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(0,0,0,0.4), rgba(0,0,0,0.85)), url(/assets/photo-7.jpg)",
      }}
    >
      <div className="max-w-[900px] mx-auto text-center">
        <div className="font-body text-xs tracking-[0.36em] uppercase font-bold text-ch-green mb-[22px]">
          Team Sova &middot; YouTube
        </div>
        <h2 className="font-display text-[clamp(48px,7vw,104px)] leading-[0.95] uppercase m-0 tracking-[-0.01em]">
          Check Out
          <br />
          My Music
        </h2>
        <p className="font-body text-lg leading-relaxed max-w-[540px] mx-auto mt-8 mb-10 text-ch-muted">
          Off the track, Cole records as part of Team Sova. New tracks land on
          YouTube and Spotify first.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button variant="ghost" href="https://www.youtube.com/@team_SOVA">
            Watch on YouTube
          </Button>
          <Button variant="link" href="#">
            Spotify &rarr;
          </Button>
        </div>
      </div>
    </section>
  );
}
