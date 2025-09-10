package com.lds.ppdoarbackend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class FrontendController {

    @RequestMapping(value = {"/", "/{path:[^\\.]*}"})
    public String redirect() {
        return "forward:/browser/index.html";
    }
}