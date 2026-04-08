import AuthStage from '@/components/auth/auth-stage';
import SignupForm from '@/components/auth/signup-form';

export default function SignupPage() {
  return (
    <AuthStage
      eyebrow="신규 가족 등록"
      title="서류 느낌 대신 서비스 경험에 가까운 가입 흐름."
      description="기본 학부모 정보를 등록한 뒤 자녀 연결, 계좌 등록, 동의 관리로 자연스럽게 이어질 수 있도록 첫 단계를 정돈했습니다."
      detail="포트폴리오에서 중요한 건 기능만 되는 화면이 아니라, 실제 고객 서비스처럼 보이는 인상입니다. 그래서 회원가입도 운영 제품처럼 보이게 밀도를 맞췄습니다."
    >
      <SignupForm />
    </AuthStage>
  );
}
