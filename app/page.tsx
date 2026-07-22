"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import CommunityPanel from "./community-panel";

type Apply = {
  id: number;
  user_sex?: number;
  depositor?: string | null;
  user?: number;
  user_id?: number;
  status?: string;
  level?: number | null;
  is_newbie?: boolean;
  apply_type?: string;
  created_at?: string;
  profile_level?: {
    tier_ko?: string;
    tier?: string;
    grade?: number | null;
  } | null;
  playstyle?: {
    style?: string;
    strength?: string;
  } | null;
};

type Match = {
  id: number;
  sex?: number;
  label_title?: string | null;
  label_stadium?: string | null;
  label_stadium2?: string | null;
  schedule?: string | null;
  player_cnt?: number;
  confirm_cnt?: number;
  total_apply_cnt?: number;
  max_player_cnt?: number;
  min_player_cnt?: number;
  fee?: number;
  playtime?: number;
  type?: string;
  apply_status?: string;
  applys?: Apply[];
  parking_fee?: string | null;
  is_parking_free?: boolean;
  is_shower?: boolean;
  is_wear?: boolean;
  is_shoes?: boolean;
};

type ApiResult = { match: Match; sourceUrl: string; applys: Apply[] };

type Region = { id: number; name: string };

type IntegratedMatch = Match & {
  area_group_name?: string | null;
  area_name?: string | null;
  label_schedule9?: string | null;
  display_level?: string | null;
  waiting_cnt?: number;
  is_apply?: boolean;
  status?: string;
  stadium_group_name?: string | null;
  female_member_count?: number;
  applicant_user_ids?: number[];
};

type IntegratedResult = { results: IntegratedMatch[]; count: number; next?: string | null };

const demoUrl = "https://abr.ge/vjss2z";

const statusLabels: Record<string, string> = {
  CONFIRM: "확정",
  CANCEL: "취소",
  WAIT: "대기",
  WAITING: "대기",
};

const styleLabels: Record<string, string> = {
  BALANCE: "밸런스",
  ATTACK: "공격형",
  DEFENSE: "수비형",
  PASS: "패스",
  SHOOT: "슈팅",
  DRIBBLE: "드리블",
};

function formatSchedule(value?: string | null) {
  if (!value) return "일정 정보 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(date);
}

function formatMoney(value?: number) {
  return typeof value === "number" ? `${value.toLocaleString("ko-KR")}원` : "-";
}

function formatMatchTime(value?: string | null) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" }).format(date);
}

function displayName(apply: Apply, index: number) {
  const name = apply.depositor?.trim();
  if (name && !name.includes("?") && !name.includes("�")) return name;
  return `참여자 ${String(index + 1).padStart(2, "0")}`;
}

function translate(value?: string | null) {
  if (!value) return "-";
  return styleLabels[value] ?? value.toLowerCase().replaceAll("_", " ");
}

function dateInputValue() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function genderLabel(sex?: number) {
  if (sex === -1) return "여성";
  if (sex === 1) return "남성";
  return "누구나";
}

function genderClass(sex?: number) {
  if (sex === -1) return "female";
  if (sex === 1) return "male";
  return "unknown";
}

export default function Home() {
  const [view, setView] = useState<"roster" | "matches" | "community">("roster");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [matchDate, setMatchDate] = useState(dateInputValue);
  const [integratedMatches, setIntegratedMatches] = useState<IntegratedMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState("");
  const [openingMatchId, setOpeningMatchId] = useState<number | null>(null);
  const [otherMatchesUserId, setOtherMatchesUserId] = useState<number | null>(null);

  useEffect(() => {
    if (view !== "matches" || regions.length) return;
    fetch("/api/regions")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "지역 정보를 불러오지 못했습니다.");
        setRegions(data.results ?? []);
      })
      .catch((requestError) => setMatchesError(requestError instanceof Error ? requestError.message : "지역 정보를 불러오지 못했습니다."));
  }, [regions.length, view]);

  async function loadIntegratedMatches(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!selectedRegion) {
      setMatchesError("지역을 선택해주세요.");
      return;
    }
    setMatchesLoading(true);
    setMatchesError("");
    try {
      const params = new URLSearchParams({ date: matchDate, region: selectedRegion });
      const response = await fetch(`/api/integrated-matches?${params.toString()}`);
      const data: IntegratedResult & { error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error ?? "매치 정보를 불러오지 못했습니다.");
      setIntegratedMatches(data.results ?? []);
    } catch (requestError) {
      setMatchesError(requestError instanceof Error ? requestError.message : "매치 정보를 불러오지 못했습니다.");
      setIntegratedMatches([]);
    } finally {
      setMatchesLoading(false);
    }
  }

  async function openMatch(matchId: number) {
    setOpeningMatchId(matchId);
    setMatchesError("");
    try {
      const matchUrl = `https://www.plabfootball.com/match/${matchId}/`;
      const response = await fetch(`/api/match?url=${encodeURIComponent(matchUrl)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "신청자 정보를 불러오지 못했습니다.");
      setUrl(matchUrl);
      setResult(data);
      setView("roster");
      setFilter("ALL");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      setMatchesError(requestError instanceof Error ? requestError.message : "신청자 정보를 불러오지 못했습니다.");
    } finally {
      setOpeningMatchId(null);
    }
  }

  function changeView(nextView: "roster" | "matches" | "community") {
    setView(nextView);
    setError("");
    setMatchesError("");
    if (nextView !== "roster") setResult(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url.trim()) {
      setError("PLAB 매치 링크를 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch(`/api/match?url=${encodeURIComponent(url.trim())}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "매치 정보를 불러오지 못했습니다.");
      setResult(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  function getOtherMatches(userId?: number) {
    if (typeof userId !== "number") return [];
    return integratedMatches.filter((item) => item.id !== match?.id && item.applicant_user_ids?.includes(userId));
  }

  const match = result?.match;
  const applications = useMemo(() => result?.applys ?? [], [result?.applys]);
  const filteredApplications = useMemo(
    () => (filter === "ALL" ? applications : applications.filter((apply) => apply.status === filter)),
    [applications, filter],
  );
  const confirmed = applications.filter((apply) => apply.status === "CONFIRM").length;
  const cancelled = applications.filter((apply) => apply.status === "CANCEL").length;
  const maxPlayers = match?.max_player_cnt ?? 0;
  const fillPercent = maxPlayers ? Math.min(100, (confirmed / maxPlayers) * 100) : 0;

  return (
    <main className="shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <nav className="topbar">
        <button className="brand brand-button" type="button" onClick={() => changeView("roster")} aria-label="PLAB 인원 확인 홈">
          <span className="brand-mark">P</span>
          <span>PLAB CHECK</span>
        </button>
        <div className="nav-tabs" role="tablist" aria-label="메뉴">
          <button type="button" className={view === "roster" ? "active" : ""} onClick={() => changeView("roster")} role="tab" aria-selected={view === "roster"}>신청자 현황</button>
          <button type="button" className={view === "matches" ? "active" : ""} onClick={() => changeView("matches")} role="tab" aria-selected={view === "matches"}>매치 정보</button>
          <button type="button" className={view === "community" ? "active" : ""} onClick={() => changeView("community")} role="tab" aria-selected={view === "community"}>커뮤니티</button>
        </div>
        <span className="topbar-note"><i /> LIVE MATCH VIEWER</span>
      </nav>

      <section className="hero">
        <p className="eyebrow">{view === "community" ? "PLAB COMMUNITY" : "MATCH INTELLIGENCE"} / {view === "roster" ? "01" : view === "matches" ? "02" : "03"}</p>
        {view === "roster" ? <>
          <h1>신청자 현황을<br /><em>한눈에</em> 확인하세요.</h1>
          <p className="hero-copy">PLAB 매치 링크 하나면 경기 정보와 신청자 명단을 깔끔하게 정리해드립니다.</p>
        </> : view === "matches" ? <>
          <h1>지역과 날짜로<br /><em>매치 정보</em>를 찾아보세요.</h1>
          <p className="hero-copy">원하는 날짜와 지역의 모든 매치를 확인하고, 매치를 클릭해 신청자 현황을 살펴보세요.</p>
        </> : <>
          <h1>풋살 이야기를<br /><em>함께 나눠보세요.</em></h1>
          <p className="hero-copy">같이 찰 사람을 찾고, 매치 후기와 구장 정보, 풋살에 대한 이야기를 자유롭게 나눌 수 있어요.</p>
        </>}

        {view === "roster" ? <form className="lookup" onSubmit={handleSubmit}>
          <div className="input-wrap">
            <span className="link-icon">↗</span>
            <label className="sr-only" htmlFor="match-link">PLAB 매치 링크</label>
            <input
              id="match-link"
              type="url"
              placeholder="https://abr.ge/vjss2z"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              autoComplete="url"
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : "현황 보기"}
            {!loading && <span>→</span>}
          </button>
        </form> : view === "matches" ? <form className="match-filters" onSubmit={loadIntegratedMatches}>
          <div className="select-wrap">
            <label htmlFor="match-date">날짜</label>
            <input id="match-date" type="date" value={matchDate} onChange={(event) => setMatchDate(event.target.value)} />
          </div>
          <div className="select-wrap region-select">
            <label htmlFor="match-region">지역</label>
            <select id="match-region" value={selectedRegion} onChange={(event) => setSelectedRegion(event.target.value)}>
              <option value="">지역 선택</option>
              {regions.map((region) => <option value={region.id} key={region.id}>{region.name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={matchesLoading}>{matchesLoading ? <span className="spinner" /> : "매치 찾기"}<span>→</span></button>
        </form> : <div className="community-hero-note"><span>닉네임 + 비밀번호</span><small>로그인 없이 글과 댓글을 남길 수 있습니다.</small></div>}
        {view === "roster" && <button className="demo-link" type="button" onClick={() => setUrl(demoUrl)}>
          예시 링크로 먼저 둘러보기 <span>↗</span>
        </button>}
        {(error || matchesError) && <p className="error-message" role="alert">{error || matchesError}</p>}
      </section>

      {view === "roster" && !result && !loading && !error && (
        <section className="empty-preview" aria-label="사용 방법">
          <div className="preview-head"><span>HOW IT WORKS</span><span>3 STEPS</span></div>
          <div className="steps">
            <div><strong>01</strong><span>링크 붙여넣기</span><small>친구에게 공유하기 버튼으로 매치 링크를 복사해 붙여넣으세요.</small></div>
            <div><strong>02</strong><span>매치 정보 조회</span><small>안전하게 경기 데이터를 확인</small></div>
            <div><strong>03</strong><span>신청자 확인</span><small>확정·취소 현황을 한 번에</small></div>
          </div>
        </section>
      )}

      {(loading || matchesLoading) && <section className="loading-card"><span className="spinner dark" /> 매치 정보를 불러오는 중입니다<span className="loading-dots">...</span></section>}

      {view === "matches" && !matchesLoading && (
        <section className="match-explorer" aria-live="polite">
          <div className="explorer-head">
            <div><p className="eyebrow">MATCH DIRECTORY</p><h2>{selectedRegion ? regions.find((region) => String(region.id) === selectedRegion)?.name : "지역"} <span>·</span> {matchDate}</h2></div>
            <div className="explorer-count"><strong>{integratedMatches.length}</strong><span>전체 매치</span></div>
          </div>
          {integratedMatches.length ? <div className="match-list">
            {integratedMatches.map((item) => (
              <article className={`match-card ${openingMatchId === item.id ? "is-opening" : ""}`} key={item.id} role="button" tabIndex={0} onClick={() => openMatch(item.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openMatch(item.id); } }}>
                <div className="match-card-time"><strong>{formatMatchTime(item.schedule)}</strong><span>{item.playtime ?? 2}시간</span></div>
                <div className="match-card-main"><div className="match-card-title"><h3>{item.label_title || item.label_stadium2 || "PLAB 매치"}</h3>{(item.female_member_count ?? 0) > 0 && <span className="gender-badge female">여성 {item.female_member_count}명</span>}</div><p>{item.area_name || item.area_group_name || "지역 정보 없음"} <span>·</span> {item.display_level || "누구나"}</p></div>
                <div className="match-card-stat"><strong>{item.confirm_cnt ?? 0}<small> / {item.max_player_cnt ?? "-"}</small></strong><span>신청 인원</span></div>
                <div className="match-card-fee"><strong>{formatMoney(item.fee)}</strong><span>{item.apply_status === "available" ? "신청 가능" : item.apply_status === "full" ? "마감" : "마감 임박"}</span></div>
                <span className="match-card-link">신청자 현황 보기 →</span>
              </article>
            ))}
          </div> : <div className="no-results match-empty"><strong>조건에 맞는 매치가 없습니다.</strong><span>다른 날짜나 지역을 선택해보세요.</span></div>}
        </section>
      )}

      {view === "roster" && match && (
        <section className="dashboard" aria-live="polite">
          <div className="dashboard-head">
            <div>
              <p className="eyebrow">MATCH #{match.id}</p>
              <div className="match-title-line"><h2>{match.label_title || match.label_stadium2 || "PLAB 매치"}</h2><span className={`gender-badge ${match.sex === -1 ? "female" : ""}`}>{genderLabel(match.sex)}</span></div>
              <p className="match-subtitle">{formatSchedule(match.schedule)} <span className="dot-separator">·</span> {match.label_stadium || match.label_stadium2 || "구장 정보 없음"}</p>
            </div>
            <a className="original-link" href={result.sourceUrl} target="_blank" rel="noreferrer">원본 매치 보기 ↗</a>
          </div>

          <div className="stats-grid">
            <article className="stat-card stat-highlight">
              <div className="stat-label">확정 인원 <span>CONFIRMED</span></div>
              <div className="stat-value">{confirmed}<small> / {maxPlayers || "-"}</small></div>
              <div className="progress"><span style={{ width: `${fillPercent}%` }} /></div>
              <p>{maxPlayers && confirmed >= maxPlayers ? "정원이 가득 찼어요" : `최소 ${match.min_player_cnt ?? "-"}명 필요`}</p>
            </article>
            <article className="stat-card">
              <div className="stat-label">전체 신청 <span>APPLICATIONS</span></div>
              <div className="stat-value">{applications.length}<small>명</small></div>
              <p>취소 {cancelled}명 포함</p>
            </article>
            <article className="stat-card">
              <div className="stat-label">참가비 <span>FEE</span></div>
              <div className="stat-value fee-value">{formatMoney(match.fee)}</div>
              <p>{match.playtime ? `${match.playtime}시간 경기` : "경기 시간 정보 없음"}</p>
            </article>
            <article className="stat-card">
              <div className="stat-label">매치 타입 <span>FORMAT</span></div>
              <div className="stat-value type-value">{match.type === "3teams" ? "3팀제" : match.type || "-"}</div>
              <p>{match.apply_status === "available" ? "신청 가능" : match.apply_status || "상태 확인 필요"}</p>
            </article>
          </div>

          <div className="content-grid">
            <div className="applications-panel">
              <div className="panel-head">
                <div><p className="eyebrow">ROSTER</p><h3>신청자 명단 <span>{applications.length}</span></h3></div>
                <div className="filters" role="group" aria-label="신청자 필터">
                  {[["ALL", "전체"], ["CONFIRM", "확정"], ["CANCEL", "취소"]].map(([value, label]) => (
                    <button key={value} type="button" className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{label}</button>
                  ))}
                </div>
              </div>
              {filteredApplications.length ? (
                <div className="application-list">
                  {filteredApplications.map((apply, index) => {
                    const userId = apply.user_id ?? apply.user;
                    const isOtherMatchesOpen = otherMatchesUserId === userId;
                    const otherMatches = getOtherMatches(userId);
                    return (
                      <div className="application-entry" key={apply.id}>
                        <article className="application-row">
                          <div className="avatar">{String(index + 1).padStart(2, "0")}</div>
                          <div className="applicant-main">
                            <div className="applicant-name">{displayName(apply, index)} <span className={`applicant-gender ${genderClass(apply.user_sex)}`}>{genderLabel(apply.user_sex)}</span> {apply.is_newbie && <span className="newbie">NEW</span>}</div>
                            <div className="applicant-meta">{apply.profile_level?.tier_ko || apply.profile_level?.tier || "레벨 미등록"} <span>·</span> {apply.apply_type === "COUPON" ? "쿠폰" : apply.apply_type === "CASH" ? "현금" : apply.apply_type || "-"}</div>
                          </div>
                          <div className="playstyle"><span>{translate(apply.playstyle?.style)}</span><small>선호 · {translate(apply.playstyle?.strength)}</small></div>
                          <div className="level-score"><strong>{apply.level ?? "-"}</strong><small>LEVEL</small></div>
                          <span className={`status status-${(apply.status || "").toLowerCase()}`}>{statusLabels[apply.status || ""] || apply.status || "미정"}</span>
                          <button
                            type="button"
                            className="other-matches-button"
                            onClick={() => setOtherMatchesUserId(isOtherMatchesOpen ? null : userId ?? null)}
                            disabled={typeof userId !== "number"}
                          >
                            다른 매치 보기
                          </button>
                        </article>
                        {isOtherMatchesOpen && (
                          <div className="other-matches-panel">
                            <div>
                              <strong>{displayName(apply, index)} 신청 매치</strong>
                              <span>현재 조회한 날짜·지역 기준</span>
                            </div>
                            {otherMatches.length ? (
                              <div className="other-matches-list">
                                {otherMatches.map((otherMatch) => (
                                  <button type="button" key={otherMatch.id} onClick={() => openMatch(otherMatch.id)}>
                                    <span>{formatMatchTime(otherMatch.schedule)}</span>
                                    <strong>{otherMatch.label_title || otherMatch.label_stadium2 || "PLAB 매치"}</strong>
                                    <small>{otherMatch.confirm_cnt ?? 0} / {otherMatch.max_player_cnt ?? "-"} 신청</small>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p>{integratedMatches.length ? "현재 조회한 날짜·지역에서 신청한 다른 매치가 없습니다." : "매치 정보 메뉴에서 날짜와 지역을 먼저 조회하면 같은 조회 범위의 다른 매치를 확인할 수 있습니다."}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : <div className="no-results">해당 상태의 신청자가 없습니다.</div>}
            </div>

            <aside className="details-panel">
              <div className="panel-head"><div><p className="eyebrow">AT A GLANCE</p><h3>매치 메모</h3></div><span className="live-badge">● LIVE</span></div>
              <div className="detail-list">
                <div><span>구장</span><strong>{match.label_stadium2 || match.label_stadium || "-"}</strong></div>
                <div><span>주차</span><strong>{match.is_parking_free ? "무료 주차" : match.parking_fee || "정보 없음"}</strong></div>
                <div><span>샤워실</span><strong>{match.is_shower ? "있음" : "없음"}</strong></div>
                <div><span>풋살화</span><strong>{match.is_shoes ? "착용 가능" : "확인 필요"}</strong></div>
              </div>
              <div className="privacy-note"><span>i</span><p>표시 정보는 PLAB 매치 링크에서 제공되는 공개 응답을 바탕으로 합니다.</p></div>
            </aside>
          </div>
          <p className="refresh-note">조회 시점 기준 · 최신 현황을 보려면 링크를 다시 조회하세요.</p>
        </section>
      )}
      {view === "community" && <CommunityPanel />}
      <footer>PLAB CHECK <span>개인용 매치 현황 도구</span></footer>
    </main>
  );
}
