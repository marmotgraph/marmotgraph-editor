/*
 * Copyright 2018 - 2021 Swiss Federal Institute of Technology Lausanne (EPFL)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * This open source software code was developed in part or in whole in the
 * Human Brain Project, funded from the European Union's Horizon 2020
 * Framework Programme for Research and Innovation under
 * Specific Grant Agreements No. 720270, No. 785907, and No. 945539
 * (Human Brain Project SGA1, SGA2 and SGA3).
 *
 */

package eu.ebrains.kg.service.api;

import eu.ebrains.kg.service.constants.Constants;
import eu.ebrains.kg.service.models.KGCoreResult;
import eu.ebrains.kg.service.services.ReleaseClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RequestMapping(Constants.ROOT_PATH_OF_API+"/releases")
@RestController
public class Releases {

    private final ReleaseClient releaseClient;

    public Releases(ReleaseClient releaseClient) {
        this.releaseClient = releaseClient;
    }

    @PutMapping("/{id}/release")
    public void putInstanceRelease(@PathVariable("id") String id) {
        releaseClient.putRelease(id);
    }

    @DeleteMapping("/{id}/release")
    public void deleteInstanceRelease(@PathVariable("id") String id) {
        releaseClient.deleteRelease(id);
    }

    @PostMapping("/status")
    public KGCoreResult<Map<String, KGCoreResult<String>>> getReleaseStatus(@RequestParam(value = "releaseTreeScope", required = false) String releaseTreeScope, @RequestBody List<String> ids) {
        Map<String, KGCoreResult<String>> releaseStatus = releaseClient.getReleaseStatus(ids, releaseTreeScope);
        return new KGCoreResult<Map<String, KGCoreResult<String>>>().setData(releaseStatus);
    }
}
