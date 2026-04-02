package com.esrg.ms_security.Interceptors;

import com.esrg.ms_security.Services.ValidatorsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

@Component
public class SecurityInterceptor implements HandlerInterceptor {
    @Autowired
    private ValidatorsService validatorService;
    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler)
            throws Exception {
        // Log all incoming requests for debugging
        System.out.println("[INTERCEPTOR] Request: " + request.getMethod() + " " + request.getRequestURI());

        // The CorsFilter now handles OPTIONS requests before they reach this interceptor.
        // If an OPTIONS request somehow gets here, we skip it.
        if (request.getMethod().equalsIgnoreCase("OPTIONS")) {
            return true;
        }

        boolean success=this.validatorService.validationRolePermission(request,request.getRequestURI(),request.getMethod());

        if (!success) {
            System.out.println("[INTERCEPTOR] Access DENIED for: " + request.getRequestURI());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
            return false;
        }
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler,
                           ModelAndView modelAndView) throws Exception {
        // Lógica a ejecutar después de que se haya manejado la solicitud por el controlador
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler,
                                Exception ex) throws Exception {
        // Lógica a ejecutar después de completar la solicitud, incluso después de la renderización de la vista
    }
}
