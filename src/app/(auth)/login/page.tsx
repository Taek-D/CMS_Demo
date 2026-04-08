import AuthStage from '@/components/auth/auth-stage';
import LoginForm from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <AuthStage
      eyebrow="멤버 로그인"
      title="학부모가 안심하고 들어올 수 있는 첫 화면."
      description="자녀 등록, 자동이체 동의 상태, 결제 이력을 한곳에서 관리할 수 있도록 서비스 안내 화면처럼 차분하게 구성했습니다."
      detail="어린이집 운영 서비스에 맞춰 과한 금융 느낌은 줄이고, 종이 질감의 표면과 절제된 포인트 컬러로 신뢰감을 주는 방향을 택했습니다."
    >
      <LoginForm />
    </AuthStage>
  );
}
