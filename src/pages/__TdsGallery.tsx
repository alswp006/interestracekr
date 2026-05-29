// @AI:DEV-ONLY — 이 페이지는 개발 모드에서만 라우트가 마운트됩니다.
// 프로덕션 빌드(npm run build)에서는 import.meta.env.DEV === false이므로
// App.tsx의 조건부 라우트가 제거되어 dist/에서 이 코드가 사라집니다.
//
// 검증: `grep -r "TdsGallery" dist/` 결과가 비어 있어야 합니다.
//
// 용도: AI 코딩 에이전트가 새 페이지를 만들 때 TDS 컴포넌트의 실제 렌더링 모습을
// 확인하고 싶을 때 dev 서버에서 `/__tds-gallery` 경로로 접속하여 참조.

import {
  Top,
  Button,
  TextField,
  Switch,
  Checkbox,
  IconButton,
  Asset,
  Spacing,
  Paragraph,
  ListRow,
  Skeleton,
  Badge,
} from "@toss/tds-mobile";
import { useState } from "react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "16px 24px" }}>
      <Paragraph.Text typography="t3">{title}</Paragraph.Text>
      <Spacing size={12} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
      <Spacing size={24} />
    </div>
  );
}

export default function TdsGallery() {
  const [text, setText] = useState("");
  const [on, setOn] = useState(false);
  const [checked, setChecked] = useState(false);

  return (
    <>
      <Top title={<Top.TitleParagraph>TDS Gallery (dev only)</Top.TitleParagraph>} />

      <Section title="Buttons">
        <Button variant="fill">Fill (primary)</Button>
        <Button variant="weak">Weak (secondary)</Button>
        <Button variant="fill" disabled>
          Disabled
        </Button>
      </Section>

      <Section title="TextField (variants)">
        <TextField variant="box" label="Box" value={text} onChange={(e) => setText(e.target.value)} />
        <TextField variant="line" label="Line" value={text} onChange={(e) => setText(e.target.value)} />
        <TextField variant="big" label="Big" value={text} onChange={(e) => setText(e.target.value)} />
      </Section>

      <Section title="Switch / Checkbox">
        <Switch checked={on} onChange={() => setOn(!on)} />
        <Checkbox.Line checked={checked} onChange={(e) => setChecked(e.target.checked)}>
          라인 체크박스
        </Checkbox.Line>
        <Checkbox.Circle checked={checked} onChange={(e) => setChecked(e.target.checked)}>
          서클 체크박스
        </Checkbox.Circle>
      </Section>

      <Section title="ListRow">
        <ListRow contents={<ListRow.Texts type="2RowTypeA" top="제목" bottom="설명 텍스트" />} />
        <ListRow contents={<ListRow.Texts type="1RowTypeA" top="단일 라인" />} />
        <ListRow
          contents={<ListRow.Texts type="Right2RowTypeA" top="제목" bottom="설명" />}
          right={<Switch checked={on} onChange={() => setOn(!on)} />}
        />
      </Section>

      <Section title="Paragraph.Text typographies">
        <Paragraph.Text typography="t1">t1 — 큰 제목</Paragraph.Text>
        <Paragraph.Text typography="t3">t3 — 중간 제목</Paragraph.Text>
        <Paragraph.Text typography="t5">t5 — 본문</Paragraph.Text>
        <Paragraph.Text typography="t7">t7 — 작은 텍스트</Paragraph.Text>
        <Paragraph.Text typography="st13">st13 — 시맨틱 라벨</Paragraph.Text>
      </Section>

      <Section title="Skeleton (loading)">
        <div style={{ width: 200, height: 24 }}>
          <Skeleton />
        </div>
        <div style={{ width: 120, height: 16 }}>
          <Skeleton />
        </div>
      </Section>

      <Section title="Badge / IconButton">
        <Badge size="medium" variant="fill" color="blue">
          5
        </Badge>
        <IconButton aria-label="홈으로" name="iconHomeRegular" onClick={() => {}} />
      </Section>

      <Section title="Asset (CDN icons & images)">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Asset.ContentIcon name="iconStarRegular" alt="별" style={{ width: 32, height: 32 }} />
          <Paragraph.Text typography="t6">Asset.ContentIcon (32px)</Paragraph.Text>
        </div>
      </Section>

      <Spacing size={48} />
    </>
  );
}
