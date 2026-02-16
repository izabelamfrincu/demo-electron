package com.example.demo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EchoController {

    private static final Logger log = LoggerFactory.getLogger(EchoController.class);

    @PostMapping(value = "/echo", consumes = { MediaType.TEXT_PLAIN_VALUE, MediaType.APPLICATION_JSON_VALUE })
    public String echo(@RequestBody String body) {
        log.info("Received /echo body: {}", body);
        return body;
    }
}
