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
import eu.ebrains.kg.service.controllers.SpaceController;
import eu.ebrains.kg.service.models.KGCoreResult;
import eu.ebrains.kg.service.models.type.StructureOfType;
import org.springframework.util.CollectionUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping(Constants.ROOT_PATH_OF_API + "/spaces")
@RestController
public class Spaces {

    private final SpaceController spaceController;

    public Spaces(SpaceController spaceController) {
        this.spaceController = spaceController;
    }

    @GetMapping("/{space}/types")
    public KGCoreResult<List<StructureOfType>> getSpaceTypes(@PathVariable("space") String space) {
        List<StructureOfType> spaceTypes = spaceController.getTypes(space);
        return new KGCoreResult<List<StructureOfType>>().setData(spaceTypes);
    }

    @PostMapping("/{space}/types")
    public KGCoreResult<List<StructureOfType>> addTypesToSpace(@PathVariable("space") String space, @RequestBody(required = true) List<String> types) {
        spaceController.addTypesToSpace(space, types);
        List<StructureOfType> relatedTypes = spaceController.getTypesByName(types, space);
        return new KGCoreResult<List<StructureOfType>>().setData(relatedTypes);
    }

    @DeleteMapping("/{space}/types")
    public void removeTypeFromSpace(@PathVariable("space") String space, @RequestParam("type") String type) {
        spaceController.removeTypeFromSpace(space, type);
    }

    @PostMapping("/{space}/initialize")
    public void initializeSpace(@PathVariable("space") String space, @RequestBody(required = false) List<String> types) {
        spaceController.initialize(space, types);
    }

}
