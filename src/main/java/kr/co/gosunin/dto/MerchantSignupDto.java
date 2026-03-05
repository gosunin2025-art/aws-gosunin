package kr.co.gosunin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class MerchantSignupDto {

    @NotBlank(message = "상호명을 입력해 주세요.")
    private String bizName;           // 상호명

    @NotBlank(message = "대표자명을 입력해 주세요.")
    private String ownerName;         // 대표자명

    private String phone;             // 연락처

    @NotBlank(message = "비밀번호를 입력해 주세요.")
    @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.")
    private String password;          // 비밀번호

    private String confirmPassword;   // 비밀번호 확인

    @NotBlank(message = "사업자등록번호를 입력해 주세요.")
    private String bizRegNo;          // 사업자등록번호

    private String verifiedBizName;   // 인증된 상호명 (자동입력)

    private String bizVerified;       // 사업자 인증 완료 여부 ("true"/"false")

    private String isMember;          // 상우회 회원 여부 ("true"/"false")

    private String memberNo;          // 회원증 번호

    @Email(message = "올바른 이메일 형식이 아닙니다.")
    @NotBlank(message = "이메일을 입력해 주세요.")
    private String email;             // 이메일

    private String otpCode;           // OTP 인증번호

    private String agreeTerms;        // 약관 동의 ("true")

    private List<String> categories;  // 취급 품목 (복수)
}