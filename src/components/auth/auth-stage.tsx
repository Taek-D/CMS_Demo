import type { ReactNode } from 'react';
import { Building2, ReceiptText, ShieldCheck, Sparkles } from 'lucide-react';

type AuthStageProps = {
  eyebrow: string;
  title: string;
  description: string;
  detail: string;
  children: ReactNode;
};

const stagePoints = [
  {
    title: '학부모 중심 가입 흐름',
    copy: '가족 계정을 만들고, 자녀를 반에 연결하고, 결제 상태를 한 화면에서 읽기 쉽게 정리합니다.',
    icon: Building2,
  },
  {
    title: '차분한 동의 절차',
    copy: '금융 동의 과정도 겁주는 문구 대신, 학부모가 안심하고 읽을 수 있는 흐름으로 구성합니다.',
    icon: ShieldCheck,
  },
  {
    title: '운영 검증까지 연결',
    copy: '같은 시스템 안에서 관리자 배치 실행, 미납 조회, 거래명세표 다운로드까지 이어집니다.',
    icon: ReceiptText,
  },
];

export default function AuthStage({
  eyebrow,
  title,
  description,
  detail,
  children,
}: AuthStageProps) {
  return (
    <div className="page-shell px-4 py-6 sm:px-6 lg:px-8">
      <div className="shell-frame grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_26rem]">
        <section className="shell-panel shell-stack flex flex-col justify-between gap-8">
          <div className="space-y-6">
            <span className="section-eyebrow">
              <Sparkles className="size-3.5" />
              {eyebrow}
            </span>
            <div className="space-y-4">
              <h1 className="section-title">{title}</h1>
              <p className="section-copy">{description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {stagePoints.map((point) => {
                const Icon = point.icon;

                return (
                  <article key={point.title} className="metric-tile space-y-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <div className="space-y-2">
                      <h2 className="font-medium text-[color:var(--brand-ink)]">
                        {point.title}
                      </h2>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {point.copy}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border/70 bg-[color:var(--surface-strong)] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
              디자인 방향
            </p>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
              {detail}
            </p>
          </div>
        </section>

        <div className="relative flex items-center">{children}</div>
      </div>
    </div>
  );
}
