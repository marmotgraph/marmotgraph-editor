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
import eu.ebrains.kg.service.controllers.IdController;
import eu.ebrains.kg.service.models.KGCoreResult;
import eu.ebrains.kg.service.models.commons.UserSummary;
import eu.ebrains.kg.service.models.user.UserProfile;
import eu.ebrains.kg.service.models.user.Space;
import eu.ebrains.kg.service.services.UserClient;
import eu.ebrains.kg.service.services.SpaceClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RequestMapping(Constants.ROOT_PATH_OF_API + "/users")
@RestController
public class Users {

    private final IdController idController;
    private final UserClient userClient;
    private final SpaceClient spaceClient;

    public Users(IdController idController, UserClient userClient, SpaceClient spaceClient) {
        this.idController = idController;
        this.userClient = userClient;
        this.spaceClient = spaceClient;
    }

    private static boolean isUserRelevantSpace(Space w){
        return (w.getClientSpace() == null || !w.getClientSpace()) && (w.getInternalSpace() == null || !w.getInternalSpace()) && (w.getPermissions() != null && w.getPermissions().isCanRead());
    }

    @GetMapping("/me")
    public KGCoreResult<UserProfile> getUserProfile() {
        UserProfile userProfile = userClient.getUserProfile();
        if(userProfile!=null) {
            UUID uuid = idController.simplifyFullyQualifiedId(userProfile.getId());
            if(uuid!=null) {
                userProfile.setId(uuid.toString());
            }
            List<Space> spaces = spaceClient.getSpaces();
            if (spaces != null) {
                List<Space> filteredSpaces = spaces.stream().filter(Users::isUserRelevantSpace).toList();
                userProfile.setSpaces(filteredSpaces);
            }
            return new KGCoreResult<UserProfile>().setData(userProfile);
        }
        return null;
    }

    @GetMapping("/search")
    public KGCoreResult<List<UserSummary>> getUsers(@RequestParam(value = "search", required = false) String search) {
        return new KGCoreResult<List<UserSummary>>().setData(userClient.getUsers(search));
    }

}
