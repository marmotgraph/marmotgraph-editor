package eu.ebrains.kg.service.configuration;

import eu.ebrains.kg.service.constants.Constants;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.function.RequestPredicate;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerResponse;

import static org.springframework.web.servlet.function.RequestPredicates.path;
import static org.springframework.web.servlet.function.RequestPredicates.pathExtension;
import static org.springframework.web.servlet.function.RouterFunctions.route;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SPARouting {

    @Bean
    RouterFunction<ServerResponse> spaRouter() {
        ClassPathResource index = new ClassPathResource("public/index.html");
        List<String> extensions = Arrays.asList("js", "css", "ico", "png", "jpg", "gif", "html", "svg");
        RequestPredicate spaPredicate = path( Constants.ROOT_PATH_OF_API+"/**").or(path("/error")).or(pathExtension(extensions::contains)).negate();
        return route(spaPredicate, request -> ServerResponse.ok().contentType(MediaType.TEXT_HTML).body(index));
    }
}
