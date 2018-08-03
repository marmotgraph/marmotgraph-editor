
/*
*   Copyright (c) 2018, EPFL/Human Brain Project PCO
*
*   Licensed under the Apache License, Version 2.0 (the "License");
*   you may not use this file except in compliance with the License.
*   You may obtain a copy of the License at
*
*       http://www.apache.org/licenses/LICENSE-2.0
*
*   Unless required by applicable law or agreed to in writing, software
*   distributed under the License is distributed on an "AS IS" BASIS,
*   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*   See the License for the specific language governing permissions and
*   limitations under the License.
*/

package editor.helpers

import common.models.NexusPath
import org.scalatestplus.play.PlaySpec
import org.scalatestplus.play.guice.GuiceOneAppPerSuite

class NavigationHeperSpec  extends PlaySpec with GuiceOneAppPerSuite{

  "NavigationHelper#formatOrg" should{
    "return the path with the original org" in {
      val path = NexusPath("minds", "test", "schema", "v0.0.3")
      val expected = NexusPath("minds", "test", "schema", "v0.0.3")
      val res = NavigationHelper.formatBackLinkOrg(path," reconciled")
      assert(res == expected)
    }
    "modify the org if needed" in {
      val path = NexusPath("mindsreconciled", "test", "schema", "v0.0.3")
      val expected = NexusPath("minds", "test", "schema", "v0.0.3")
      val res = NavigationHelper.formatBackLinkOrg(path, "reconciled")
      assert(res == expected)
    }
  }
}
