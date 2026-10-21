# Application Load Balancer Visual

An animated, beginner-friendly, interactive diagram that explains the **AWS Application Load Balancer (ALB)** in nine steps, using the story of Ravi's online shop. No dependencies, no build step. Part of the **#Buildwithvinit** series, a sequel to the VPC Visual project.

## The story
Ravi's shop is getting popular. A receptionist (the ALB) stands at the front door and shares visitors between several web servers so none of them gets overloaded.

## AWS ALB concepts
- **Application Load Balancer** works at Layer 7 and accepts HTTP/HTTPS requests.
- **Listener** checks for connections on a port (80, 443) and applies rules.
- **Target group** is the set of targets (EC2 instances) that receive traffic.
- **Health checks** keep traffic away from unhealthy targets.
- **Auto Scaling Group** adds or removes EC2 instances; new ones receive traffic after passing health checks.
- **Security groups**, **TLS termination** (certificate from ACM) and **CloudWatch** secure and monitor the setup.

## The nine steps
1. **Visitors:** customers reach the shop through the internet.
2. **DNS:** Route 53 resolves the domain to the ALB.
3. **Application Load Balancer:** the receptionist accepts HTTP/HTTPS requests.
4. **Listener:** ports 80 and 443 and listener rules.
5. **Target Group:** two EC2 web servers.
6. **Traffic Distribution:** requests shared across healthy EC2 instances in two Availability Zones.
7. **Health Checks:** one server turns red; new requests go to healthy targets.
8. **Scaling:** an Auto Scaling Group adds a third EC2 instance that joins after passing health checks.
9. **Complete Architecture:** the full flow with security groups, HTTPS/TLS termination and CloudWatch.

## Moving-object legend
| Object | Meaning |
|---|---|
| ✉️ | Incoming HTTP request |
| 🛒 | Customer request |
| ✅ | Healthy target |
| ❌ | Unhealthy target |
| 📦 | Server response |
| 🛡️ | HTTPS security |
| 📊 | Monitoring activity |

Colours: blue = internet and DNS, teal = ALB, gold = listener, purple = target group, green = healthy, red = unhealthy.

## Controls
Play, Pause, Reset, click any step (everything up to it is revealed), **Simulate EC2 failure** (from step 6) and **Run health check & restore**. A Light/Dark toggle changes the page theme.

## Run locally
```bash
cd application-load-balancer-visual
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to GitHub Pages
1. Create a repository and push these files to the `main` branch.
2. Open **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`.
3. Visit `https://<your-username>.github.io/<repo-name>/`.

## Project structure
```
application-load-balancer-visual/
├── index.html      page and inline SVG diagram
├── css/style.css   theme, layout, animations
├── js/app.js       steps, reveal logic, failure simulation
├── .nojekyll       tells GitHub Pages to skip Jekyll
├── LICENSE         MIT
└── README.md
```

## Customisation
- **Text:** edit the `STEPS` array at the top of `js/app.js`.
- **Colours:** change the CSS variables in `:root` of `css/style.css`.
- **Servers:** edit the `SRV` array in `js/app.js` (id, y position, step it appears, zone).
- **Reveal timing:** every diagram element has `data-s="N"`, the step where it appears.
- **Autoplay speed:** change `5000` in `restartTimer()`.

## License
MIT © Vinit · #Buildwithvinit
