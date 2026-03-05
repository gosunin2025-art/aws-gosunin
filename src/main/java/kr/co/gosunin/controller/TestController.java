package kr.co.gosunin.controller;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import kr.co.gosunin.dto.MerchantSignupDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Slf4j
@Controller
@RequestMapping("/test")
public class TestController {

    @GetMapping("/main")
    public String main() {
        return "main";
    }

    /* ── GET /test/signup ── */
    @GetMapping("/signup")
    public String signupForm(Model model) {
        model.addAttribute("signupDto", new MerchantSignupDto());
        return "signup";
    }

    /* ── POST /test/signup ── */
    @PostMapping("/signup")
    public String signupSubmit(
            @Valid @ModelAttribute("signupDto") MerchantSignupDto dto,
            BindingResult bindingResult,
            RedirectAttributes redirectAttributes,
            Model model) {

        if (bindingResult.hasErrors()) return "signup";

        if (!dto.getPassword().equals(dto.getConfirmPassword())) {
            bindingResult.rejectValue("password", "password.mismatch", "비밀번호가 일치하지 않습니다.");
            return "signup";
        }
        if (!"true".equals(dto.getAgreeTerms())) {
            model.addAttribute("errorMsg", "이용약관에 동의해 주세요.");
            return "signup";
        }
        if (!"true".equals(dto.getBizVerified())) {
            model.addAttribute("errorMsg", "사업자등록번호 인증을 완료해 주세요.");
            return "signup";
        }
        if (!"true".equals(dto.getIsMember())) {
            model.addAttribute("errorMsg", "선인상우회 회원만 가입이 가능합니다.");
            return "signup";
        }
        if (dto.getCategories() == null || dto.getCategories().isEmpty()) {
            model.addAttribute("errorMsg", "취급 품목을 1개 이상 선택해 주세요.");
            return "signup";
        }

        // TODO: merchantService.register(dto)

        // 가입 완료 → 로그인 페이지로 redirect + 성공 메시지
        redirectAttributes.addFlashAttribute("signupSuccess", true);
        redirectAttributes.addFlashAttribute("merchantName", dto.getBizName());
        return "redirect:/test/login";
    }

    /* ── GET /test/login ── */
    @GetMapping("/login")
    public String loginForm() {
        return "login";
    }

    /* ── POST /test/login ── */
    @PostMapping("/login")
    public String loginSubmit(
            @RequestParam String email,
            @RequestParam String password,
            @RequestParam(required = false) String remember,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        log.info("로그인 시도: {}", email);

        /*
         * TODO: 실제 인증 로직
         * MerchantDto merchant = merchantService.login(email, password);
         */

        // 임시 시뮬레이션 (test@test.com / 12345678)
        boolean loginSuccess = "test@test.com".equals(email) && "12345678".equals(password);

        if (!loginSuccess) {
            redirectAttributes.addFlashAttribute("loginError", true);
            redirectAttributes.addFlashAttribute("savedEmail", email);
            return "redirect:/test/login";
        }

        session.setAttribute("loginEmail", email);
        return "redirect:/test/dashboard";
    }

    /* ── GET /test/dashboard ── */
    @GetMapping("/dashboard")
    public String dashboard(HttpSession session, Model model) {
        // TODO: 로그인 체크 추가
        // if (session.getAttribute("loginEmail") == null) return "redirect:/test/login";
        return "dashboard";
    }

    /* ── GET /test/about ── */
    @GetMapping("/about")
    public String about() {
        return "about";
    }


    @GetMapping("/architecture")
    public String architecture() {
        return "architecture";
    }

    @GetMapping("/page-flow-diagram")
    public String pageFlowDiagram() {
        return "page-flow-diagram";
    }
}